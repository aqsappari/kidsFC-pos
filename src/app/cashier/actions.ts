"use server";

import { db } from "@/db";
import {
  products,
  categories,
  ingredients,
  recipeItems,
  orders,
  orderItems,
  inventoryLogs,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getPOSData() {
  const allCategories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });

  // Fetch only available products that have recipe items mapped
  const allProducts = await db.query.products.findMany({
    where: eq(products.isAvailable, true),
    with: {
      category: true,
      recipeItems: {
        with: {
          ingredient: true,
        },
      },
    },
    orderBy: (products, { asc }) => [asc(products.name)],
  });

  return {
    categories: allCategories,
    products: allProducts,
  };
}

export async function processPOSOrder(data: {
  paymentMethod: string;
  totalAmount: number;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
}) {
  const orderId = "ord_" + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();

  try {
    db.transaction((tx) => {
      // 1. Insert Order
      tx.insert(orders)
        .values({
          id: orderId,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          status: "completed",
          createdAt: now,
        })
        .run();

      // 2. Loop through cart items
      for (const cartItem of data.items) {
        const orderItemId = "oi_" + Math.random().toString(36).substring(2, 9);

        tx.insert(orderItems)
          .values({
            id: orderItemId,
            orderId: orderId,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            unitPrice: cartItem.unitPrice,
          })
          .run();

        // 3. Fetch product details for logs
        const prodRecord = tx
          .select()
          .from(products)
          .where(eq(products.id, cartItem.productId))
          .get();
        const prodName = prodRecord?.name || "Product";

        // 4. Fetch product recipe items synchronously
        const prodRecipeItems = tx
          .select()
          .from(recipeItems)
          .where(eq(recipeItems.productId, cartItem.productId))
          .all();

        for (const ri of prodRecipeItems) {
          const totalDeduction = ri.quantity * cartItem.quantity;

          // Fetch current ingredient stock synchronously
          const ing = tx
            .select()
            .from(ingredients)
            .where(eq(ingredients.id, ri.ingredientId))
            .get();

          if (ing) {
            const newStock = Math.max(0, ing.stockQuantity - totalDeduction);

            // Update ingredient stock
            tx.update(ingredients)
              .set({ stockQuantity: newStock })
              .where(eq(ingredients.id, ri.ingredientId))
              .run();

            // Log inventory movement
            tx.insert(inventoryLogs)
              .values({
                id: "inv_" + Math.random().toString(36).substring(2, 9),
                ingredientId: ri.ingredientId,
                type: "sale",
                quantityChange: -totalDeduction,
                referenceId: orderId,
                reason: `POS Sale Order #${orderId} (${prodName} x${cartItem.quantity})`,
                createdAt: now,
              })
              .run();
          }
        }
      }
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/reports");
    revalidatePath("/cashier");
    return { success: true, orderId };
  } catch (error) {
    console.error("Failed to process POS order:", error);
    return { success: false, error: "Checkout transaction failed." };
  }
}
