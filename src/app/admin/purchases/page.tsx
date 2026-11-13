"use client";

import { useState, useEffect } from "react";
import {
  PackagePlus,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  History,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { getIngredients, recordPurchase, getPurchasesHistory } from "./actions";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  stockQuantity: number;
}

interface PurchaseItemForm {
  ingredientId: string;
  quantityPurchased: number;
  purchaseUnitName: string;
  unitMultiplier: number;
  totalItemCost: number;
}

export default function PurchasesPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");

  // Form State
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItemForm[]>([
    {
      ingredientId: "",
      quantityPurchased: 1,
      purchaseUnitName: "pcs",
      unitMultiplier: 1,
      totalItemCost: 0,
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const ingList = await getIngredients();
    setIngredients(ingList);
    const histList = await getPurchasesHistory();
    setHistory(histList);
  }

  const addItemRow = () => {
    setItems([
      ...items,
      {
        ingredientId: "",
        quantityPurchased: 1,
        purchaseUnitName: "pcs",
        unitMultiplier: 1,
        totalItemCost: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof PurchaseItemForm,
    value: any,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-select base unit if ingredient changes
    if (field === "ingredientId") {
      const selected = ingredients.find((i) => i.id === value);
      if (selected) {
        newItems[index].purchaseUnitName = selected.unit;
        newItems[index].unitMultiplier = 1;
      }
    }

    setItems(newItems);
  };

  const totalPurchaseCost = items.reduce(
    (sum, item) => sum + (Number(item.totalItemCost) || 0),
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !items[0].ingredientId) {
      alert("Please add at least one valid item.");
      return;
    }

    setIsSubmitting(true);
    const res = await recordPurchase({
      totalCost: totalPurchaseCost,
      notes,
      items,
    });

    setIsSubmitting(false);
    if (res.success) {
      setSuccessMsg("Stock-in recorded successfully! Inventory updated.");
      setItems([
        {
          ingredientId: "",
          quantityPurchased: 1,
          purchaseUnitName: "pcs",
          unitMultiplier: 1,
          totalItemCost: 0,
        },
      ]);
      setNotes("");
      loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      alert("Error recording purchase.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6 md:p-10 font-sans">
      {/* Top Header Navigation */}
      <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark font-['Montserrat'] flex items-center gap-2">
              <PackagePlus className="w-7 h-7 text-brand" /> Stock-In Purchases
            </h1>
            <p className="text-zinc-500 text-sm">
              Log supplier deliveries (sacks, packs, boxes) & automatically
              update base inventory.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-200/70 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("new")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "new"
                ? "bg-white text-brand-dark shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            New Delivery
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-white text-brand-dark shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <History className="w-4 h-4" /> History
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-success/10 border border-success/20 text-success flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">{successMsg}</span>
          </div>
        )}

        {activeTab === "new" ? (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 md:p-8"
          >
            <div className="mb-6">
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-2">
                Delivery Notes / Supplier Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Weekly wet market run, Supplier: Aling Nena"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand text-sm"
              />
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 font-['Montserrat']">
                  Purchased Items
                </h3>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand/10 text-brand font-semibold text-xs hover:bg-brand/20 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>

              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/60 items-center"
                >
                  {/* Ingredient Selector */}
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                      Ingredient
                    </label>
                    <select
                      value={item.ingredientId}
                      onChange={(e) =>
                        updateItem(index, "ingredientId", e.target.value)
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    >
                      <option value="">Select Ingredient...</option>
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} (Base unit: {ing.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity Purchased */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                      Qty Bought
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={item.quantityPurchased}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "quantityPurchased",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  {/* Purchase Unit Name */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                      Package Unit
                    </label>
                    <input
                      type="text"
                      placeholder="sack, pack, box"
                      value={item.purchaseUnitName}
                      onChange={(e) =>
                        updateItem(index, "purchaseUnitName", e.target.value)
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  {/* Unit Multiplier */}
                  <div className="md:col-span-2">
                    <label
                      className="block text-[11px] font-bold text-zinc-500 uppercase mb-1"
                      title="How many base units in 1 package?"
                    >
                      Multiplier
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={item.unitMultiplier}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "unitMultiplier",
                          parseFloat(e.target.value) || 1,
                        )
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">
                      Adds:{" "}
                      {(item.quantityPurchased * item.unitMultiplier).toFixed(
                        2,
                      )}{" "}
                      base units
                    </span>
                  </div>

                  {/* Total Item Cost */}
                  <div className="md:col-span-1">
                    <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">
                      Total Cost
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.totalItemCost}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "totalItemCost",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>

                  {/* Delete Row */}
                  <div className="md:col-span-1 flex items-end justify-center pt-5">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="p-2 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total and Submit */}
            <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-zinc-100 gap-4">
              <div className="text-lg font-bold text-zinc-800">
                Total Delivery Cost:{" "}
                <span className="text-brand font-extrabold">
                  ₱{totalPurchaseCost.toFixed(2)}
                </span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-8 py-3.5 rounded-2xl bg-brand text-white font-semibold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Recording..." : "Save & Update Inventory"}
              </button>
            </div>
          </form>
        ) : (
          /* History View */
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200">
                <ShoppingCart className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-500 font-medium">
                  No purchase records found yet.
                </p>
              </div>
            ) : (
              history.map((pur) => (
                <div
                  key={pur.id}
                  className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-100 gap-2">
                    <div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary/10 text-secondary">
                        {new Date(pur.purchasedAt).toLocaleString()}
                      </span>
                      {pur.notes && (
                        <p className="text-sm font-medium text-zinc-800 mt-2">
                          {pur.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-400 block">
                        Total Cost
                      </span>
                      <span className="text-lg font-extrabold text-brand-dark">
                        ₱{pur.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Items Received:
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pur.items.map((pi: any) => (
                        <div
                          key={pi.id}
                          className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between text-sm"
                        >
                          <div>
                            <span className="font-bold text-zinc-900">
                              {pi.ingredient?.name || "Unknown"}
                            </span>
                            <p className="text-xs text-zinc-500">
                              Bought: {pi.quantityPurchased}{" "}
                              {pi.purchaseUnitName} (Multiplier:{" "}
                              {pi.unitMultiplier})
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-brand">
                              +{pi.totalBaseQuantityAdded} {pi.ingredient?.unit}
                            </span>
                            <span className="block text-xs text-zinc-400">
                              ₱{pi.totalItemCost.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
