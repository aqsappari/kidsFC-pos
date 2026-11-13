"use server";

import { db } from "@/db";
import { products, ingredients, recipeItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getRecipeBuilderData() {
  const allProducts = await db.query.products.findMany({
    with: {
      recipeItems: {
        with: {
          ingredient: true,
        },
      },
    },
    orderBy: (products, { asc }) => [asc(products.name)],
  });

  const allIngredients = await db.query.ingredients.findMany({
    orderBy: (ingredients, { asc }) => [asc(ingredients.name)],
  });

  return {
    products: allProducts,
    ingredients: allIngredients,
  };
}

export async function saveProductRecipe(
  productId: string,
  items: { ingredientId: string; quantity: number }[],
) {
  try {
    await db.transaction(async (tx) => {
      // 1. Remove existing recipe items for this product
      await tx.delete(recipeItems).where(eq(recipeItems.productId, productId));

      // 2. Insert updated recipe items
      if (items.length > 0) {
        const newRecords = items.map((item) => ({
          id: "rec_" + Math.random().toString(36).substring(2, 9),
          productId,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
        }));

        await tx.insert(recipeItems).values(newRecords);
      }
    });

    revalidatePath("/admin/recipes");
    revalidatePath("/cashier");
    return { success: true };
  } catch (error) {
    console.error("Failed to save recipe:", error);
    return { success: false, error: "Failed to save recipe." };
  }
}
