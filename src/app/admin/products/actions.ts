"use server";

import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProductsPageData() {
  const allCategories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });

  const allProducts = await db.query.products.findMany({
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

export async function createCategory(name: string) {
  try {
    const id = "cat_" + Math.random().toString(36).substring(2, 9);
    await db.insert(categories).values({ id, name });
    revalidatePath("/admin/products");
    revalidatePath("/admin/recipes");
    revalidatePath("/cashier");
    return { success: true };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { success: false, error: "Category name might already exist." };
  }
}

export async function saveProduct(data: {
  id?: string;
  name: string;
  categoryId: string | null;
  sellingPrice: number;
  isAvailable: boolean;
}) {
  try {
    if (data.id) {
      await db
        .update(products)
        .set({
          name: data.name,
          categoryId: data.categoryId || null,
          sellingPrice: data.sellingPrice,
          isAvailable: data.isAvailable,
        })
        .where(eq(products.id, data.id));
    } else {
      const id = "prod_" + Math.random().toString(36).substring(2, 9);
      await db.insert(products).values({
        id,
        name: data.name,
        categoryId: data.categoryId || null,
        sellingPrice: data.sellingPrice,
        isAvailable: data.isAvailable,
      });
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/recipes");
    revalidatePath("/cashier");
    return { success: true };
  } catch (error) {
    console.error("Failed to save product:", error);
    return { success: false, error: "Product name might already exist." };
  }
}

export async function toggleProductAvailability(
  id: string,
  currentStatus: boolean,
) {
  try {
    await db
      .update(products)
      .set({ isAvailable: !currentStatus })
      .where(eq(products.id, id));

    revalidatePath("/admin/products");
    revalidatePath("/cashier");
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle availability:", error);
    return { success: false };
  }
}
