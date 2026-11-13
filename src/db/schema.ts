import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ==========================================
// 1. INVENTORY & RAW MATERIALS
// ==========================================
export const ingredients = sqliteTable("ingredients", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  unit: text("unit").notNull(), // Base unit used in recipes: 'kg', 'g', 'ml', 'pcs'
  costPerUnit: real("cost_per_unit").notNull(), // Cost per 1 base unit
  stockQuantity: real("stock_quantity").notNull().default(0), // Current physical stock in base units
  minThreshold: real("min_threshold").default(0), // Low-stock warning level
});

// ==========================================
// 2. MENU CATEGORIES, PRODUCTS & RECIPES
// ==========================================
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "Burgers", "Rice Meals", "Drinks"
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull().unique(),
  sellingPrice: real("selling_price").notNull(),
  isAvailable: integer("is_available", { mode: "boolean" })
    .notNull()
    .default(true),
});

// Bill of Materials (BOM): Links Products to Ingredients
export const recipeItems = sqliteTable("recipe_items", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  ingredientId: text("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "restrict" }),
  quantity: real("quantity").notNull(), // Amount of base unit used per 1 product sold
});

// ==========================================
// 3. STOCK-IN (SUPPLIERS & PURCHASES)
// ==========================================
export const suppliers = sqliteTable("suppliers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  contactNumber: text("contact_number"),
});

export const purchases = sqliteTable("purchases", {
  id: text("id").primaryKey(),
  supplierId: text("supplier_id").references(() => suppliers.id, {
    onDelete: "set null",
  }),
  totalCost: real("total_cost").notNull(),
  purchasedAt: text("purchased_at").notNull(), // ISO timestamp (e.g., new Date().toISOString())
  notes: text("notes"),
});

export const purchaseItems = sqliteTable("purchase_items", {
  id: text("id").primaryKey(),
  purchaseId: text("purchase_id")
    .notNull()
    .references(() => purchases.id, { onDelete: "cascade" }),
  ingredientId: text("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "restrict" }),
  quantityPurchased: real("quantity_purchased").notNull(), // e.g., 2 (sacks), 5 (packs)
  purchaseUnitName: text("purchase_unit_name").notNull(), // e.g., 'sack', 'pack', 'pcs'
  unitMultiplier: real("unit_multiplier").notNull(), // e.g., 25 (for 25kg sack), 6 (for pack of 6)
  totalBaseQuantityAdded: real("total_base_quantity_added").notNull(), // quantityPurchased * unitMultiplier
  totalItemCost: real("total_item_cost").notNull(), // Total cost for this line item
});

// ==========================================
// 4. STOCK-OUT (POS SALES & ORDERS)
// ==========================================
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  totalAmount: real("total_amount").notNull(),
  paymentMethod: text("payment_method").notNull(), // e.g., 'cash', 'gcash', 'maya', 'card'
  status: text("status").notNull().default("completed"), // 'completed', 'voided'
  createdAt: text("created_at").notNull(), // ISO timestamp
});

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(), // Snapshot of sellingPrice at the time of sale
});

// ==========================================
// 5. INVENTORY AUDIT LOGS & OPERATIONAL EXPENSES
// ==========================================
export const inventoryLogs = sqliteTable("inventory_logs", {
  id: text("id").primaryKey(),
  ingredientId: text("ingredient_id")
    .notNull()
    .references(() => ingredients.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'restock', 'sale', 'waste', 'adjustment'
  quantityChange: real("quantity_change").notNull(), // (+) for restock, (-) for sale/waste
  referenceId: text("reference_id"), // Optional: links to orderId or purchaseId
  reason: text("reason"), // e.g., "Spoiled", "POS Sale #102", "Delivery"
  createdAt: text("created_at").notNull(), // ISO timestamp
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(), // e.g., "LPG Gas Refill", "Takeout Boxes", "Electricity"
  category: text("category").notNull(), // 'utility', 'consumable', 'rent', 'salary', 'other'
  amount: real("amount").notNull(),
  date: text("date").notNull(), // ISO timestamp or YYYY-MM-DD
  notes: text("notes"),
});

// ==========================================
// 6. TABLE RELATIONS
// ==========================================
// ==========================================
// 6. TABLE RELATIONS
// ==========================================
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  recipeItems: many(recipeItems),
  orderItems: many(orderItems),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  recipeItems: many(recipeItems),
  purchaseItems: many(purchaseItems),
  inventoryLogs: many(inventoryLogs),
}));

export const recipeItemsRelations = relations(recipeItems, ({ one }) => ({
  product: one(products, {
    fields: [recipeItems.productId],
    references: [products.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeItems.ingredientId],
    references: [ingredients.id],
  }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [purchases.supplierId],
    references: [suppliers.id],
  }),
  items: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, {
    fields: [purchaseItems.purchaseId],
    references: [purchases.id],
  }),
  ingredient: one(ingredients, {
    fields: [purchaseItems.ingredientId],
    references: [ingredients.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  ingredient: one(ingredients, {
    fields: [inventoryLogs.ingredientId],
    references: [ingredients.id],
  }),
}));
