"use server";

import { db } from "@/db";
import { orders, ingredients, products } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";

export async function getAdminDashboardMetrics() {
  // 1. Fetch all completed orders
  const allOrders = await db.query.orders.findMany({
    where: eq(orders.status, "completed"),
  });

  // 2. Fetch all ingredients to check for low stock
  const allIngredients = await db.query.ingredients.findMany();

  // 3. Fetch all products count
  const allProducts = await db.query.products.findMany();

  // Calculate today's sales (compare ISO date string prefix YYYY-MM-DD)
  const todayStr = new Date().toISOString().split("T")[0];
  let todaySales = 0;
  let todayOrdersCount = 0;

  for (const ord of allOrders) {
    if (ord.createdAt.startsWith(todayStr)) {
      todaySales += ord.totalAmount;
      todayOrdersCount += 1;
    }
  }

  // Count low-stock ingredients
  const lowStockIngredients = allIngredients.filter(
    (item) =>
      item.minThreshold !== null && item.stockQuantity <= item.minThreshold,
  );

  return {
    todaySales,
    todayOrdersCount,
    totalOrdersCount: allOrders.length,
    totalIngredientsCount: allIngredients.length,
    totalProductsCount: allProducts.length,
    lowStockCount: lowStockIngredients.length,
    lowStockItems: lowStockIngredients.slice(0, 5),
  };
}
