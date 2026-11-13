import { db } from "./index";
import {
  inventoryLogs,
  orderItems,
  orders,
  purchaseItems,
  purchases,
  recipeItems,
  products,
  categories,
  ingredients,
  suppliers,
  expenses,
} from "./schema";

async function resetDatabase() {
  console.log("🧹 Clearing all records from the database...");

  await db.transaction(async (tx) => {
    // 1. Delete child / dependent records first (to respect foreign key constraints)
    await tx.delete(inventoryLogs);
    await tx.delete(orderItems);
    await tx.delete(purchaseItems);
    await tx.delete(recipeItems);

    // 2. Delete parent transaction & catalog records
    await tx.delete(orders);
    await tx.delete(purchases);
    await tx.delete(products);
    await tx.delete(expenses);

    // 3. Delete root reference tables
    await tx.delete(categories);
    await tx.delete(ingredients);
    await tx.delete(suppliers);
  });

  console.log("✅ Database is now completely empty!");
}

resetDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed to reset database:", err);
    process.exit(1);
  });
