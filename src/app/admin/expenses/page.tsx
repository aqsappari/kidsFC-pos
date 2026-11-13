"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Receipt,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Tag,
  DollarSign,
} from "lucide-react";
import { getExpensesData, saveExpense } from "./actions";

interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes: string | null;
}

const EXPENSE_CATEGORIES = [
  "utility",
  "consumable",
  "rent",
  "salary",
  "maintenance",
  "other",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "utility",
    amount: 0,
    date: "", // Initialized empty to prevent server/client hydration mismatch
    notes: "",
  });

  useEffect(() => {
    loadData();
    // Safely set the current date on client-side mount
    setFormData((prev) => ({
      ...prev,
      date: new Date().toISOString().split("T")[0],
    }));
  }, []);

  async function loadData() {
    const data = await getExpensesData();
    setExpenses(data);
  }

  const openAddModal = () => {
    setFormData({
      title: "",
      category: "utility",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveExpense(formData);

    if (res.success) {
      setSuccessMsg("Expense recorded successfully!");
      setShowModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      alert(res.error || "Failed to save expense.");
    }
  };

  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategoryFilter === "all" ||
      item.category === selectedCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const totalExpensesAmount = filteredExpenses.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark font-['Montserrat'] flex items-center gap-2">
              <Receipt className="w-7 h-7 text-brand" /> Operational Expenses &
              Consumables
            </h1>
            <p className="text-zinc-500 text-sm">
              Track rent, utilities, packaging boxes, gas refills, and staff
              wages.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" /> Log New Expense
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-success/10 border border-success/20 text-success flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">{successMsg}</span>
          </div>
        )}

        {/* Summary Card & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-3xl border border-zinc-200/85 shadow-sm p-6 flex flex-col justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Filtered Expenses
            </span>
            <p className="text-3xl font-extrabold text-brand-dark mt-2">
              ₱{totalExpensesAmount.toFixed(2)}
            </p>
            <span className="text-xs text-zinc-500 mt-1">
              Across {filteredExpenses.length} record(s)
            </span>
          </div>

          <div className="md:col-span-2 bg-white rounded-3xl border border-zinc-200/85 shadow-sm p-6 flex flex-col justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                <button
                  onClick={() => setSelectedCategoryFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategoryFilter === "all"
                      ? "bg-brand text-white shadow-xs"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  All
                </button>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategoryFilter === cat
                        ? "bg-brand text-white shadow-xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Expense Title / Description</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Notes</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-zinc-400">
                      No expense records found. Click "Log New Expense" to
                      start.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/60 transition-colors"
                    >
                      <td className="py-4 px-6 text-zinc-600 font-mono text-xs">
                        {item.date}
                      </td>
                      <td className="py-4 px-6 font-bold text-zinc-900">
                        {item.title}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary-dark font-bold text-[11px] uppercase tracking-wider">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-zinc-500 text-xs">
                        {item.notes || "—"}
                      </td>
                      <td className="py-4 px-6 text-right font-extrabold text-danger">
                        ₱{item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-zinc-100">
            <h3 className="text-xl font-bold text-zinc-900 font-['Montserrat'] mb-4">
              Log Operational Expense
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                  Expense Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Monthly Electric Bill, Takeout Boxes (50pcs), LPG Refill"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white uppercase text-xs font-bold"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                    Amount (₱)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Paid via Cash, Supplier details"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-brand/20"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
