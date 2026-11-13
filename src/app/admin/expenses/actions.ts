"use server";

import { db } from "@/db";
import { expenses } from "@/db/schema";
import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getExpensesData() {
  const allExpenses = await db.query.expenses.findMany({
    orderBy: [desc(expenses.date)],
  });
  return allExpenses;
}

export async function saveExpense(data: {
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}) {
  try {
    const id = "exp_" + Math.random().toString(36).substring(2, 9);
    await db.insert(expenses).values({
      id,
      title: data.title,
      category: data.category,
      amount: data.amount,
      date: data.date,
      notes: data.notes || null,
    });

    revalidatePath("/admin/expenses");
    return { success: true };
  } catch (error) {
    console.error("Failed to save expense:", error);
    return { success: false, error: "Failed to record expense." };
  }
}
