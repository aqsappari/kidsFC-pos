"use server";

import { db } from "@/db";
import {
  purchases,
  purchaseItems,
  ingredients,
  inventoryLogs,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getIngredients() {
  return await db.select().from(ingredients).all();
}

export async function getPurchasesHistory() {
  const result = await db.query.purchases.findMany({
    with: {
      supplier: true,
      items: {
        with: {
          ingredient: true,
        },
      },
    },
    orderBy: (purchases, { desc }) => [desc(purchases.purchasedAt)],
  });
  return result;
}

export async function recordPurchase(data: {
  supplierName?: string;
  totalCost: number;
  notes?: string;
  items: {
    ingredientId: string;
    quantityPurchased: number;
    purchaseUnitName: string;
    unitMultiplier: number;
    totalItemCost: number;
  }[];
}) {
  const purchaseId = "pur_" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  try {
    await db.transaction(async (tx) => {
      // 1. Insert Purchase Record
      await tx.insert(purchases).values({
        id: purchaseId,
        totalCost: data.totalCost,
        purchasedAt: now,
        notes: data.notes || null,
      });

      // 2. Loop through items, insert purchase items, update ingredient stock & cost
      for (const item of data.items) {
        const totalBaseQtyAdded = item.quantityPurchased * item.unitMultiplier;
        const purchaseItemId =
          "pi_" + Math.random().toString(36).substring(2, 9);

        await tx.insert(purchaseItems).values({
          id: purchaseItemId,
          purchaseId: purchaseId,
          ingredientId: item.ingredientId,
          quantityPurchased: item.quantityPurchased,
          purchaseUnitName: item.purchaseUnitName,
          unitMultiplier: item.unitMultiplier,
          totalBaseQuantityAdded: totalBaseQtyAdded,
          totalItemCost: item.totalItemCost,
        });

        // Fetch current ingredient stock
        const currentIng = await tx.query.ingredients.findFirst({
          where: eq(ingredients.id, item.ingredientId),
        });

        if (currentIng) {
          const newStock = currentIng.stockQuantity + totalBaseQtyAdded;
          // Calculate new unit cost (Total cost divided by total base units added in this batch)
          const newCostPerUnit = item.totalItemCost / totalBaseQtyAdded;

          // Update ingredient stock and cost price
          await tx
            .update(ingredients)
            .set({
              stockQuantity: newStock,
              costPerUnit:
                newCostPerUnit > 0 ? newCostPerUnit : currentIng.costPerUnit,
            })
            .where(eq(ingredients.id, item.ingredientId));

          // Log inventory movement
          await tx.insert(inventoryLogs).values({
            id: "inv_" + Math.random().toString(36).substring(2, 9),
            ingredientId: item.ingredientId,
            type: "restock",
            quantityChange: totalBaseQtyAdded,
            referenceId: purchaseId,
            reason: `Restock: ${item.quantityPurchased} ${item.purchaseUnitName}(s)`,
            createdAt: now,
          });
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to record purchase:", error);
    return { success: false, error: "Database transaction failed." };
  }
}
