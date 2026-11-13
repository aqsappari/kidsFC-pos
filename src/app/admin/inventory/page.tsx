"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Boxes,
  Plus,
  AlertTriangle,
  Search,
  Edit2,
  CheckCircle2,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";
import {
  getInventoryData,
  saveIngredient,
  logWasteOrAdjustment,
} from "./actions";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  stockQuantity: number;
  minThreshold: number | null;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null,
  );

  // Waste / Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustIngredient, setAdjustIngredient] = useState<Ingredient | null>(
    null,
  );
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [isWastage, setIsWastage] = useState(true);

  // Form State for Add/Edit
  const [formData, setFormData] = useState({
    name: "",
    unit: "kg",
    costPerUnit: 0,
    stockQuantity: 0,
    minThreshold: 5,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await getInventoryData();
    setInventory(data);
  }

  const openAddModal = () => {
    setEditingIngredient(null);
    setFormData({
      name: "",
      unit: "kg",
      costPerUnit: 0,
      stockQuantity: 0,
      minThreshold: 5,
    });
    setShowAddModal(true);
  };

  const openEditModal = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setFormData({
      name: ing.name,
      unit: ing.unit,
      costPerUnit: ing.costPerUnit,
      stockQuantity: ing.stockQuantity,
      minThreshold: ing.minThreshold ?? 5,
    });
    setShowAddModal(true);
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveIngredient({
      id: editingIngredient ? editingIngredient.id : undefined,
      ...formData,
    });

    if (res.success) {
      setSuccessMsg(
        editingIngredient
          ? "Ingredient updated successfully!"
          : "New ingredient added!",
      );
      setShowAddModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      alert(res.error || "Failed to save ingredient.");
    }
  };

  const openAdjustModal = (ing: Ingredient, wastage: boolean) => {
    setAdjustIngredient(ing);
    setIsWastage(wastage);
    setAdjustQty(1);
    setAdjustReason(
      wastage ? "Spoilage / Expired ingredient" : "Physical count correction",
    );
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustIngredient) return;

    const finalChange = isWastage ? -Math.abs(adjustQty) : Number(adjustQty);
    const res = await logWasteOrAdjustment({
      ingredientId: adjustIngredient.id,
      quantityChange: finalChange,
      reason: adjustReason,
    });

    if (res.success) {
      setSuccessMsg("Inventory stock adjusted successfully.");
      setShowAdjustModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      alert(res.error || "Adjustment failed.");
    }
  };

  const filteredInventory = inventory.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const lowStockCount = inventory.filter(
    (item) =>
      item.minThreshold !== null && item.stockQuantity <= item.minThreshold,
  ).length;

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
              <Boxes className="w-7 h-7 text-brand" /> Ingredient Inventory
            </h1>
            <p className="text-zinc-500 text-sm">
              Monitor raw stock levels, base units, unit costs, and low-stock
              alerts.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 cursor-pointer self-start"
        >
          <Plus className="w-4 h-4" /> Add New Ingredient
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-success/10 border border-success/20 text-success flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">{successMsg}</span>
          </div>
        )}

        {lowStockCount > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-warning/10 border border-warning/30 text-warning-dark flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-warning" />
            <span className="text-sm font-semibold">
              Warning: {lowStockCount} ingredient(s) are at or below their
              low-stock threshold! Check restock needs.
            </span>
          </div>
        )}

        {/* Search & Stats Bar */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="text-xs font-medium text-zinc-500">
              Total Managed Ingredients:{" "}
              <strong className="text-zinc-900">{inventory.length}</strong>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-4 px-6">Ingredient Name</th>
                  <th className="py-4 px-6">Base Unit</th>
                  <th className="py-4 px-6">Cost per Unit</th>
                  <th className="py-4 px-6">Current Stock</th>
                  <th className="py-4 px-6">Low Threshold</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-400">
                      No ingredients found. Click "Add New Ingredient" to get
                      started.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const isLow =
                      item.minThreshold !== null &&
                      item.stockQuantity <= item.minThreshold;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-zinc-50/60 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-zinc-900">
                          <div className="flex items-center gap-2">
                            {item.name}
                            {isLow && (
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/20 text-warning-dark"
                                title="Low stock warning"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" /> Low
                                Stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-zinc-600 font-mono text-xs">
                          {item.unit}
                        </td>
                        <td className="py-4 px-6 font-semibold text-zinc-800">
                          ₱{item.costPerUnit.toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`font-extrabold ${
                              isLow ? "text-warning" : "text-brand-dark"
                            }`}
                          >
                            {item.stockQuantity} {item.unit}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-zinc-500">
                          {item.minThreshold !== null
                            ? `${item.minThreshold} ${item.unit}`
                            : "None"}
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => openAdjustModal(item, true)}
                            className="px-2.5 py-1.5 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 text-xs font-semibold transition-colors cursor-pointer"
                            title="Log Waste / Spoilage"
                          >
                            Log Waste
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer inline-flex items-center"
                            title="Edit Ingredient Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-zinc-100">
            <h3 className="text-xl font-bold text-zinc-900 font-['Montserrat'] mb-4">
              {editingIngredient ? "Edit Ingredient" : "Add New Ingredient"}
            </h3>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Cooking Oil, Beef Patty, Rice"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                    Base Unit
                  </label>
                  <input
                    type="text"
                    placeholder="kg, g, ml, pcs"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                    Cost / Unit (₱)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.costPerUnit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPerUnit: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stockQuantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                    Min Threshold
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.minThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minThreshold: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-brand/20"
                >
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Waste / Adjustment Modal */}
      {showAdjustModal && adjustIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-zinc-100">
            <h3 className="text-xl font-bold text-zinc-900 font-['Montserrat'] mb-1">
              Log Waste / Deduction
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Item:{" "}
              <strong className="text-zinc-800">{adjustIngredient.name}</strong>{" "}
              (Current stock: {adjustIngredient.stockQuantity}{" "}
              {adjustIngredient.unit})
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                  Quantity to Deduct ({adjustIngredient.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={adjustQty}
                  onChange={(e) =>
                    setAdjustQty(parseFloat(e.target.value) || 0)
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., Spoiled lettuce, dropped sauce"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-danger hover:bg-red-700 text-white font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-danger/20"
                >
                  Deduct Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
