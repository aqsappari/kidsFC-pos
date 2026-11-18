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

// Save order to current active session
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

// Clear active session entirely
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

// Delete a specific order from the active session by orderId
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

// Export current active session or specified date orders
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

    // Write workbook directly to a Node.js Buffer instead of writing to disk
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
