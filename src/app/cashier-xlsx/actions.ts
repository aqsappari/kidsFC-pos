"use server";

import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

interface ExcelRow {
  Name?: string;
  ProductName?: string;
  Category?: string;
  Price?: number | string;
}

export async function getIndependentMenuData() {
  try {
    const filePath = path.join(process.cwd(), "menu.xlsx");
    if (!fs.existsSync(filePath)) {
      return { categories: [], products: [] };
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json<ExcelRow>(
      workbook.Sheets[sheetName],
    );

    const categoriesMap = new Map<string, { id: string; name: string }>();
    const products = sheetData.map((row, index) => {
      const categoryName = row.Category || "General";
      const catId = categoryName.toLowerCase().replace(/\s+/g, "_");

      if (!categoriesMap.has(catId)) {
        categoriesMap.set(catId, { id: catId, name: categoryName });
      }

      return {
        id: `xlsx_item_${index + 1}`,
        name: row.Name || row.ProductName || "Unnamed Item",
        sellingPrice: Number(row.Price) || 0,
        categoryId: catId,
        category: { id: catId, name: categoryName },
      };
    });

    return {
      categories: Array.from(categoriesMap.values()),
      products,
    };
  } catch (error) {
    console.error("Error reading menu.xlsx:", error);
    return { categories: [], products: [] };
  }
}

export async function saveIndependentOrder(orderData: {
  paymentMethod: string;
  totalAmount: number;
  items: any[];
}) {
  try {
    const orderRecord = {
      orderId: "xlsx_ord_" + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ...orderData,
    };

    // Save to a local independent orders file
    const ordersFilePath = path.join(process.cwd(), "xlsx_orders.json");
    let existingOrders = [];
    if (fs.existsSync(ordersFilePath)) {
      const fileData = fs.readFileSync(ordersFilePath, "utf-8");
      existingOrders = JSON.parse(fileData);
    }

    existingOrders.push(orderRecord);
    fs.writeFileSync(ordersFilePath, JSON.stringify(existingOrders, null, 2));

    return { success: true, orderId: orderRecord.orderId };
  } catch (error) {
    console.error("Failed to save independent order:", error);
    return { success: false, error: "Failed to save order." };
  }
}
