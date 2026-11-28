"use server";

import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface GroupedProduct {
  id: string;
  name: string;
  sellingPrice: number;
  categoryId: string;
  category: { id: string; name: string };
  variants: ProductVariant[];
  stock: number;
}

const STORAGE_DIR = path.join(process.cwd(), "data_sessions");

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

export async function getIndependentMenuData() {
  try {
    const filePath = path.join(process.cwd(), "menu.xlsx");
    if (!fs.existsSync(filePath)) {
      console.warn("menu.xlsx not found at root directory.");
      return { categories: [], products: [] };
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    const sheetName = workbook.SheetNames.includes("Menu")
      ? "Menu"
      : workbook.SheetNames[0];

    const sheetData = XLSX.utils.sheet_to_json<Record<string, any>>(
      workbook.Sheets[sheetName],
    );

    // 1. Build map of Item IDs from Menu sheet for variant mapping
    const variantRowToItemId = new Map<string, string>();
    sheetData.forEach((row, index) => {
      const variantKey = `xlsx_item_${index + 1}`;
      const itemId = String(row["Item ID"] || "").trim();
      if (itemId) {
        variantRowToItemId.set(variantKey, itemId);
      }
    });

    // 2. Parse 'Filtered Menu' sheet for stock and batch levels
    const stockMap = new Map<string, number>();
    if (workbook.SheetNames.includes("Filtered Menu")) {
      const filteredData = XLSX.utils.sheet_to_json<Record<string, any>>(
        workbook.Sheets["Filtered Menu"],
      );
      filteredData.forEach((row) => {
        const itemId = String(row["Item ID"] || "").trim();
        const variantDetails = String(row["Variant / Details"] || "")
          .trim()
          .toLowerCase();
        const totalStock = Number(
          row["Total Stock"] ?? row["Initial Batch"] ?? 0,
        );

        if (itemId) {
          const key = `${itemId}::${variantDetails}`;
          stockMap.set(key, totalStock);
        }
      });
    }

    // 3. Load active session orders and aggregate sold counts by Item ID
    const activeSession = await getActiveSessionData();
    const soldCountsByItemId = new Map<string, number>();

    if (activeSession && activeSession.orders) {
      activeSession.orders.forEach((ord: any) => {
        ord.items?.forEach((item: any) => {
          const pid = item.productId;
          const qty = item.quantity || 0;
          const itemId = variantRowToItemId.get(pid) || pid;
          const current = soldCountsByItemId.get(itemId) || 0;
          soldCountsByItemId.set(itemId, current + qty);
        });
      });
    }

    const categoriesMap = new Map<string, { id: string; name: string }>();
    const productsMap = new Map<string, GroupedProduct>();

    sheetData.forEach((row, index) => {
      const categoryName = String(
        row.Category || row.category || "General",
      ).trim();

      const rawName = String(
        row["Item Name"] || row.ItemName || row.Name || "Unnamed Item",
      ).trim();

      if (!rawName) return;

      const rawVariant = String(
        row["Variant / Details"] || row.Variant || "Standard",
      ).trim();

      const price = Number(row["Price (₱)"] ?? row.Price ?? 0);
      const itemId = String(row["Item ID"] || "").trim();
      const variantType = String(row["Variant Type"] || "Dependent")
        .trim()
        .toLowerCase();

      // Determine initial stock from Filtered Menu map
      let initialStock = 0;
      if (itemId) {
        if (variantType === "dependent") {
          const sharedKey = `${itemId}::all variants`;
          initialStock = stockMap.get(sharedKey) ?? stockMap.get(itemId) ?? 0;
        } else {
          const specificKey = `${itemId}::${rawVariant.toLowerCase()}`;
          initialStock = stockMap.get(specificKey) ?? stockMap.get(itemId) ?? 0;
        }
      }

      const catId = categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

      if (!categoriesMap.has(catId)) {
        categoriesMap.set(catId, { id: catId, name: categoryName });
      }

      const groupKey = `${catId}::${rawName.toLowerCase()}`;
      const variantId = `xlsx_item_${index + 1}`;

      // Deduct total sold for this Item ID
      const totalSoldForItem = soldCountsByItemId.get(itemId) || 0;
      const remainingStock = Math.max(0, initialStock - totalSoldForItem);

      if (!productsMap.has(groupKey)) {
        productsMap.set(groupKey, {
          id: variantId,
          name: rawName,
          sellingPrice: price,
          categoryId: catId,
          category: { id: catId, name: categoryName },
          variants: [],
          stock: 0,
        });
      }

      const existingGroup = productsMap.get(groupKey)!;

      if (price < existingGroup.sellingPrice) {
        existingGroup.sellingPrice = price;
      }

      existingGroup.variants.push({
        id: variantId,
        name: rawVariant,
        price,
        stock: remainingStock,
      });

      if (variantType === "dependent") {
        existingGroup.stock = remainingStock;
      } else {
        existingGroup.stock = existingGroup.variants.reduce(
          (sum, v) => sum + v.stock,
          0,
        );
      }
    });

    return {
      categories: Array.from(categoriesMap.values()),
      products: Array.from(productsMap.values()),
    };
  } catch (error) {
    console.error("Error reading menu.xlsx:", error);
    return { categories: [], products: [] };
  }
}

export async function saveIndependentOrder(orderData: {
  paymentMethod: string;
  tableNumber?: string;
  totalAmount: number;
  items: any[];
}) {
  try {
    ensureStorageDir();
    const activeSessionPath = path.join(STORAGE_DIR, "active_session.json");

    let sessionData = {
      sessionId:
        "session_" +
        new Date().toISOString().split("T")[0] +
        "_" +
        Math.random().toString(36).substring(2, 6),
      date: new Date().toISOString().split("T")[0],
      orders: [] as any[],
    };

    if (fs.existsSync(activeSessionPath)) {
      sessionData = JSON.parse(fs.readFileSync(activeSessionPath, "utf-8"));
    }

    const queueNumber = sessionData.orders.length + 1;

    const orderRecord = {
      orderId: "xlsx_ord_" + Math.random().toString(36).substring(2, 9),
      queueNumber,
      tableNumber: orderData.tableNumber || "Takeout / Walk-in",
      timestamp: new Date().toISOString(),
      ...orderData,
    };

    sessionData.orders.push(orderRecord);
    fs.writeFileSync(activeSessionPath, JSON.stringify(sessionData, null, 2));

    return { success: true, orderId: orderRecord.orderId, queueNumber };
  } catch (error) {
    console.error("Failed to save independent order:", error);
    return { success: false, error: "Failed to save order." };
  }
}

export async function getActiveSessionData() {
  try {
    ensureStorageDir();
    const activeSessionPath = path.join(STORAGE_DIR, "active_session.json");
    if (!fs.existsSync(activeSessionPath)) {
      return {
        sessionId: "session_" + new Date().toISOString().split("T")[0],
        date: new Date().toISOString().split("T")[0],
        orders: [],
      };
    }
    return JSON.parse(fs.readFileSync(activeSessionPath, "utf-8"));
  } catch (error) {
    return { orders: [], date: new Date().toISOString().split("T")[0] };
  }
}

export async function restartSession() {
  try {
    ensureStorageDir();
    const activeSessionPath = path.join(STORAGE_DIR, "active_session.json");
    if (fs.existsSync(activeSessionPath)) {
      fs.unlinkSync(activeSessionPath);
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to restart session:", error);
    return { success: false, error: "Failed to restart session." };
  }
}

export async function deleteActiveSessionOrder(orderId: string) {
  try {
    ensureStorageDir();
    const activeSessionPath = path.join(STORAGE_DIR, "active_session.json");
    if (fs.existsSync(activeSessionPath)) {
      let sessionData = JSON.parse(fs.readFileSync(activeSessionPath, "utf-8"));
      if (sessionData.orders) {
        sessionData.orders = sessionData.orders.filter(
          (o: any) => o.orderId !== orderId,
        );
        fs.writeFileSync(
          activeSessionPath,
          JSON.stringify(sessionData, null, 2),
        );
      }
    }
    return { success: true };
  } catch (error) {
    console.error("Failed to delete active session order:", error);
    return { success: false, error: "Failed to delete order." };
  }
}

export async function exportSessionByDate(dateStr: string) {
  try {
    ensureStorageDir();
    const activeSession = await getActiveSessionData();

    const matchingSessions = [];
    if (activeSession && activeSession.orders?.length > 0) {
      matchingSessions.push(activeSession);
    }

    if (matchingSessions.length === 0) {
      return {
        success: false,
        error: "No orders found in the active session.",
      };
    }

    const combinedOrders: any[] = [];
    matchingSessions.forEach((session: any) => {
      if (session.orders) {
        combinedOrders.push(...session.orders);
      }
    });

    const excelRows: any[] = [];
    combinedOrders.forEach((ord) => {
      ord.items.forEach((item: any) => {
        excelRows.push({
          Date: ord.timestamp ? ord.timestamp.split("T")[0] : dateStr,
          "Session ID": ord.orderId ? ord.orderId.substring(0, 15) : "session",
          "Queue #": ord.queueNumber || 1,
          "Table / Location": ord.tableNumber || "Takeout / Walk-in",
          "Order ID": ord.orderId,
          "Product Name": item.name,
          Quantity: item.quantity,
          "Unit Price (₱)": item.unitPrice,
          "Line Total (₱)": item.quantity * item.unitPrice,
          "Payment Method": ord.paymentMethod,
          "Order Total (₱)": ord.totalAmount,
          Timestamp: ord.timestamp,
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Sales_${dateStr}`);

    const exportFileName = `Active_Session_Export_${dateStr}.xlsx`;

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });
    const base64Data = Buffer.from(excelBuffer).toString("base64");

    return {
      success: true,
      fileName: exportFileName,
      fileData: base64Data,
    };
  } catch (error) {
    console.error("Export failed:", error);
    return { success: false, error: "Failed to generate Excel export." };
  }
}
