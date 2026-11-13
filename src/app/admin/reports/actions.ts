"use server";

import { db } from "@/db";
import {
  orders,
  orderItems,
  expenses,
  products,
  recipeItems,
  ingredients,
} from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export async function getFinancialReports() {
  // 1. Fetch all completed orders with their items
  const allOrders = await db.query.orders.findMany({
    where: eq(orders.status, "completed"),
    with: {
      items: {
        with: {
          product: {
            with: {
              recipeItems: {
                with: {
                  ingredient: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [desc(orders.createdAt)],
  });

  // 2. Fetch all operational expenses
  const allExpenses = await db.query.expenses.findMany();

  // 3. Compute Metrics
  let totalGrossRevenue = 0;
  let totalEstimatedFoodCost = 0;
  let totalItemSalesCount = 0;

  const productSalesMap: Record<
    string,
    { name: string; qtySold: number; revenue: number }
  > = {};

  // Cast order as any or explicitly type items to satisfy TypeScript iterator check
  for (const order of allOrders as any[]) {
    totalGrossRevenue += order.totalAmount;

    // Ensure order.items is treated as an array
    const items = (order.items || []) as any[];

    for (const item of items) {
      totalItemSalesCount += item.quantity;
      const prodName = item.product?.name || "Unknown Product";

      if (!productSalesMap[item.productId]) {
        productSalesMap[item.productId] = {
          name: prodName,
          qtySold: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.productId].qtySold += item.quantity;
      productSalesMap[item.productId].revenue += item.quantity * item.unitPrice;

      // Calculate food cost for this item sold based on its recipe
      if (item.product?.recipeItems) {
        let singleItemCost = 0;
        for (const ri of item.product.recipeItems) {
          const costPerUnit = ri.ingredient?.costPerUnit || 0;
          singleItemCost += ri.quantity * costPerUnit;
        }
        totalEstimatedFoodCost += singleItemCost * item.quantity;
      }
    }
  }

  const totalOperationalExpenses = allExpenses.reduce(
    (sum, exp) => sum + exp.amount,
    0,
  );
  const grossProfit = totalGrossRevenue - totalEstimatedFoodCost;
  const netProfit = grossProfit - totalOperationalExpenses;
  const netProfitMargin =
    totalGrossRevenue > 0 ? (netProfit / totalGrossRevenue) * 100 : 0;

  const topSellingProducts = Object.values(productSalesMap).sort(
    (a, b) => b.qtySold - a.qtySold,
  );

  return {
    totalGrossRevenue,
    totalEstimatedFoodCost,
    grossProfit,
    totalOperationalExpenses,
    netProfit,
    netProfitMargin,
    totalOrdersCount: allOrders.length,
    totalItemSalesCount,
    topSellingProducts,
    recentOrders: allOrders.slice(0, 10),
    allExpenses: allExpenses.slice(0, 10),
  };
}
