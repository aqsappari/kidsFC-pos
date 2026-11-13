"use server";

import { db } from "@/db";
import { ingredients, inventoryLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getInventoryData() {
  const allIngredients = await db.query.ingredients.findMany({
    orderBy: (ingredients, { asc }) => [asc(ingredients.name)],
  });
  return allIngredients;
}

export async function saveIngredient(data: {
  id?: string;
  name: string;
  unit: string;
  costPerUnit: number;
  stockQuantity: number;
  minThreshold: number;
}) {
  const now = new Date().toISOString();

  try {
    await db.transaction(async (tx) => {
      if (data.id) {
        // Update existing ingredient
        const existing = await tx.query.ingredients.findFirst({
          where: eq(ingredients.id, data.id),
        });

        if (existing) {
          const qtyDifference = data.stockQuantity - existing.stockQuantity;

          await tx
            .update(ingredients)
            .set({
              name: data.name,
              unit: data.unit,
              costPerUnit: data.costPerUnit,
              stockQuantity: data.stockQuantity,
              minThreshold: data.minThreshold,
            })
            .where(eq(ingredients.id, data.id));

          // If stock quantity was manually adjusted, log the movement
          if (qtyDifference !== 0) {
            await tx.insert(inventoryLogs).values({
              id: "inv_" + Math.random().toString(36).substring(2, 9),
              ingredientId: data.id,
              type: qtyDifference > 0 ? "adjustment_in" : "adjustment_out",
              quantityChange: qtyDifference,
              reason: "Manual inventory count adjustment",
              createdAt: now,
            });
          }
        }
      } else {
        // Create new ingredient
        const newId = "ing_" + Math.random().toString(36).substring(2, 9);
        await tx.insert(ingredients).values({
          id: newId,
          name: data.name,
          unit: data.unit,
          costPerUnit: data.costPerUnit,
          stockQuantity: data.stockQuantity,
          minThreshold: data.minThreshold,
        });

        if (data.stockQuantity > 0) {
          await tx.insert(inventoryLogs).values({
            id: "inv_" + Math.random().toString(36).substring(2, 9),
            ingredientId: newId,
            type: "initial_stock",
            quantityChange: data.stockQuantity,
            reason: "Initial inventory setup",
            createdAt: now,
          });
        }
      }
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/recipes");
    revalidatePath("/cashier");
    return { success: true };
  } catch (error) {
    console.error("Failed to save ingredient:", error);
    return {
      success: false,
      error: "Failed to save ingredient. Name might already exist.",
    };
  }
}

export async function logWasteOrAdjustment(data: {
  ingredientId: string;
  quantityChange: number; // Negative for waste, positive for find/correction
  reason: string;
}) {
  const now = new Date().toISOString();
  try {
    await db.transaction(async (tx) => {
      const ing = await tx.query.ingredients.findFirst({
        where: eq(ingredients.id, data.ingredientId),
      });

      if (!ing) throw new Error("Ingredient not found");

      const newStock = ing.stockQuantity + data.quantityChange;
      if (newStock < 0) throw new Error("Stock cannot go below zero.");

      await tx
        .update(ingredients)
        .set({ stockQuantity: newStock })
        .where(eq(ingredients.id, data.ingredientId));

      await tx.insert(inventoryLogs).values({
        id: "inv_" + Math.random().toString(36).substring(2, 9),
        ingredientId: data.ingredientId,
        type: data.quantityChange < 0 ? "waste" : "adjustment",
        quantityChange: data.quantityChange,
        reason: data.reason,
        createdAt: now,
      });
    });

    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to log adjustment:", error);
    return {
      success: false,
      error: error.message || "Failed to record adjustment.",
    };
  }
}
