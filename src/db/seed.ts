import { db } from "./index";
import {
  categories,
  ingredients,
  products,
  recipeItems,
  suppliers,
  expenses,
  inventoryLogs,
} from "./schema";

async function seed() {
  console.log("🌱 Seeding restaurant POS database...");

  const now = new Date().toISOString();
  const todayDate = now.split("T")[0];

  // 1. Seed Categories
  const categoryData = [
    { id: "cat_burgers", name: "Burgers & Sandwiches" },
    { id: "cat_rice", name: "Rice Meals" },
    { id: "cat_drinks", name: "Drinks & Refreshments" },
    { id: "cat_sides", name: "Sides & Snacks" },
  ];

  for (const cat of categoryData) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }

  // 2. Seed Suppliers
  const supplierData = [
    {
      id: "sup_wetmarket",
      name: "Central Wet Market & Meat Shop",
      contactNumber: "0917-123-4567",
    },
    {
      id: "sup_beverage",
      name: "Metro Beverage & Packaging Supply",
      contactNumber: "0918-987-6543",
    },
  ];

  for (const sup of supplierData) {
    await db.insert(suppliers).values(sup).onConflictDoNothing();
  }

  // 3. Seed Raw Ingredients & Consumables (Base Units)
  const ingredientData = [
    {
      id: "ing_patty",
      name: "Beef Burger Patty",
      unit: "pcs",
      costPerUnit: 28.0,
      stockQuantity: 50,
      minThreshold: 10,
    },
    {
      id: "ing_bun",
      name: "Brioche Burger Bun",
      unit: "pcs",
      costPerUnit: 8.5,
      stockQuantity: 60,
      minThreshold: 15,
    },
    {
      id: "ing_cheese",
      name: "Cheddar Cheese Slice",
      unit: "pcs",
      costPerUnit: 6.0,
      stockQuantity: 80,
      minThreshold: 20,
    },
    {
      id: "ing_rice",
      name: "Steamed White Rice",
      unit: "g",
      costPerUnit: 0.055, // ₱55 per kg = ₱0.055 per gram
      stockQuantity: 25000, // 25kg sack
      minThreshold: 5000,
    },
    {
      id: "ing_chicken",
      name: "Marinated Chicken Quarter",
      unit: "pcs",
      costPerUnit: 45.0,
      stockQuantity: 40,
      minThreshold: 10,
    },
    {
      id: "ing_fries",
      name: "Shoestring Potato Fries",
      unit: "g",
      costPerUnit: 0.14, // ₱140 per kg = ₱0.14 per gram
      stockQuantity: 10000, // 10kg
      minThreshold: 2000,
    },
    {
      id: "ing_icedtea_powder",
      name: "Lemon Iced Tea Concentrate",
      unit: "ml",
      costPerUnit: 0.08,
      stockQuantity: 5000, // 5 Liters
      minThreshold: 1000,
    },
    {
      id: "ing_cup_16oz",
      name: "16oz Clear Cup & Lid",
      unit: "pcs",
      costPerUnit: 4.5,
      stockQuantity: 100,
      minThreshold: 25,
    },
    {
      id: "ing_takeout_box",
      name: "Kraft Paper Meal Box",
      unit: "pcs",
      costPerUnit: 5.0,
      stockQuantity: 100,
      minThreshold: 20,
    },
  ];

  for (const ing of ingredientData) {
    await db.insert(ingredients).values(ing).onConflictDoNothing();
  }

  // 4. Seed Menu Products
  const productData = [
    {
      id: "prod_cheeseburger",
      categoryId: "cat_burgers",
      name: "Classic Cheeseburger",
      sellingPrice: 95.0,
      isAvailable: true,
    },
    {
      id: "prod_double_burger",
      categoryId: "cat_burgers",
      name: "Double Patty Overload Burger",
      sellingPrice: 145.0,
      isAvailable: true,
    },
    {
      id: "prod_chicken_rice",
      categoryId: "cat_rice",
      name: "Crispy Fried Chicken w/ Rice",
      sellingPrice: 120.0,
      isAvailable: true,
    },
    {
      id: "prod_fries_regular",
      categoryId: "cat_sides",
      name: "Crispy French Fries (Regular)",
      sellingPrice: 60.0,
      isAvailable: true,
    },
    {
      id: "prod_iced_tea",
      categoryId: "cat_drinks",
      name: "House Blend Lemon Iced Tea (16oz)",
      sellingPrice: 45.0,
      isAvailable: true,
    },
  ];

  for (const prod of productData) {
    await db.insert(products).values(prod).onConflictDoNothing();
  }

  // 5. Seed Recipes (Bill of Materials)
  const recipeData = [
    // Classic Cheeseburger (Cost: 28 + 8.5 + 6 = ₱42.50 | Price: ₱95.00)
    {
      id: "rec_cb_1",
      productId: "prod_cheeseburger",
      ingredientId: "ing_bun",
      quantity: 1,
    },
    {
      id: "rec_cb_2",
      productId: "prod_cheeseburger",
      ingredientId: "ing_patty",
      quantity: 1,
    },
    {
      id: "rec_cb_3",
      productId: "prod_cheeseburger",
      ingredientId: "ing_cheese",
      quantity: 1,
    },

    // Double Patty Overload Burger (Cost: 56 + 8.5 + 12 = ₱76.50 | Price: ₱145.00)
    {
      id: "rec_db_1",
      productId: "prod_double_burger",
      ingredientId: "ing_bun",
      quantity: 1,
    },
    {
      id: "rec_db_2",
      productId: "prod_double_burger",
      ingredientId: "ing_patty",
      quantity: 2,
    },
    {
      id: "rec_db_3",
      productId: "prod_double_burger",
      ingredientId: "ing_cheese",
      quantity: 2,
    },

    // Crispy Fried Chicken w/ Rice (Cost: 45 + (200 * 0.055) + 5 = ₱61.00 | Price: ₱120.00)
    {
      id: "rec_cr_1",
      productId: "prod_chicken_rice",
      ingredientId: "ing_chicken",
      quantity: 1,
    },
    {
      id: "rec_cr_2",
      productId: "prod_chicken_rice",
      ingredientId: "ing_rice",
      quantity: 200,
    }, // 200g per cup
    {
      id: "rec_cr_3",
      productId: "prod_chicken_rice",
      ingredientId: "ing_takeout_box",
      quantity: 1,
    },

    // Crispy French Fries (Cost: 150 * 0.14 = ₱21.00 | Price: ₱60.00)
    {
      id: "rec_fr_1",
      productId: "prod_fries_regular",
      ingredientId: "ing_fries",
      quantity: 150,
    }, // 150g per serving

    // Lemon Iced Tea (Cost: (350 * 0.08) + 4.5 = ₱32.50 | Price: ₱45.00)
    {
      id: "rec_it_1",
      productId: "prod_iced_tea",
      ingredientId: "ing_icedtea_powder",
      quantity: 350,
    }, // 350ml
    {
      id: "rec_it_2",
      productId: "prod_iced_tea",
      ingredientId: "ing_cup_16oz",
      quantity: 1,
    },
  ];

  for (const rec of recipeData) {
    await db.insert(recipeItems).values(rec).onConflictDoNothing();
  }

  // 6. Seed Sample Operational Expenses
  const expenseData = [
    {
      id: "exp_lpg_1",
      title: "Commercial LPG Tank Refill (11kg)",
      category: "utility",
      amount: 980.0,
      date: todayDate,
      notes: "Kitchen stove main tank",
    },
    {
      id: "exp_napkins_1",
      title: "Table Napkins & Plastic Utensils Pack",
      category: "consumable",
      amount: 320.0,
      date: todayDate,
      notes: "Purchased from Metro Supply",
    },
  ];

  for (const exp of expenseData) {
    await db.insert(expenses).values(exp).onConflictDoNothing();
  }

  console.log("✅ Seed completed successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error seeding database:", err);
    process.exit(1);
  });
