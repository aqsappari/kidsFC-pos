"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChefHat,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Search,
  Calculator,
  Package,
} from "lucide-react";
import { getRecipeBuilderData, saveProductRecipe } from "./actions";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  costPerUnit: number;
  stockQuantity: number;
}

interface RecipeItem {
  id?: string;
  ingredientId: string;
  quantity: number;
}

interface ProductWithRecipe {
  id: string;
  name: string;
  sellingPrice: number;
  isAvailable: boolean;
  recipeItems: {
    id: string;
    ingredientId: string;
    quantity: number;
    ingredient: Ingredient;
  }[];
}

export default function RecipesPage() {
  const [products, setProducts] = useState<ProductWithRecipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );

  // Editor State
  const [draftItems, setDraftItems] = useState<RecipeItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await getRecipeBuilderData();
    setProducts(data.products);
    setIngredients(data.ingredients);

    // Auto-select first product if none selected
    if (data.products.length > 0 && !selectedProductId) {
      selectProduct(data.products[0]);
    } else if (selectedProductId) {
      const updated = data.products.find((p) => p.id === selectedProductId);
      if (updated) selectProduct(updated);
    }
  }

  const selectProduct = (product: ProductWithRecipe) => {
    setSelectedProductId(product.id);
    setSuccessMsg("");
    setDraftItems(
      product.recipeItems.map((ri) => ({
        ingredientId: ri.ingredientId,
        quantity: ri.quantity,
      })),
    );
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleAddIngredientRow = () => {
    setDraftItems([...draftItems, { ingredientId: "", quantity: 1 }]);
  };

  const handleRemoveRow = (index: number) => {
    setDraftItems(draftItems.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (
    index: number,
    field: keyof RecipeItem,
    value: any,
  ) => {
    const updated = [...draftItems];
    updated[index] = { ...updated[index], [field]: value };
    setDraftItems(updated);
  };

  // Live Cost & Margin Calculations
  const totalFoodCost = draftItems.reduce((sum, item) => {
    const ing = ingredients.find((i) => i.id === item.ingredientId);
    if (!ing) return sum;
    return sum + ing.costPerUnit * (Number(item.quantity) || 0);
  }, 0);

  const sellingPrice = selectedProduct?.sellingPrice || 0;
  const grossProfit = sellingPrice - totalFoodCost;
  const profitMarginPercent =
    sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;

  // How many servings can we make with current physical stock?
  const maxServingsPossible =
    draftItems.length > 0 &&
    draftItems.every((d) => d.ingredientId && d.quantity > 0)
      ? Math.floor(
          Math.min(
            ...draftItems.map((item) => {
              const ing = ingredients.find((i) => i.id === item.ingredientId);
              if (!ing || item.quantity <= 0) return 0;
              return ing.stockQuantity / item.quantity;
            }),
          ),
        )
      : null;

  const handleSaveRecipe = async () => {
    if (!selectedProductId) return;

    // Validate no empty ingredient selections and no duplicates
    const validItems = draftItems.filter(
      (item) => item.ingredientId && item.quantity > 0,
    );
    const uniqueIds = new Set(validItems.map((i) => i.ingredientId));
    if (uniqueIds.size !== validItems.length) {
      alert(
        "Duplicate ingredients detected! Combine quantities into a single row.",
      );
      return;
    }

    setIsSaving(true);
    const res = await saveProductRecipe(selectedProductId, validItems);
    setIsSaving(false);

    if (res.success) {
      setSuccessMsg("Recipe & cost breakdown saved!");
      await loadData();
      setTimeout(() => setSuccessMsg(""), 3500);
    } else {
      alert("Error saving recipe.");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark font-['Montserrat'] flex items-center gap-2">
              <ChefHat className="w-7 h-7 text-brand" /> Recipe & Costing
              Builder
            </h1>
            <p className="text-zinc-500 text-sm">
              Map exact ingredient & packaging quantities per menu item to
              automate stock deductions.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Product Selector List */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-5 flex flex-col h-[calc(100vh-190px)]">
          <div className="relative mb-4">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-zinc-400 text-sm py-8">
                No menu items found. Add products first!
              </p>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = product.id === selectedProductId;
                const hasRecipe = product.recipeItems.length > 0;
                const currentCost = product.recipeItems.reduce(
                  (acc, ri) =>
                    acc + ri.quantity * (ri.ingredient?.costPerUnit || 0),
                  0,
                );

                return (
                  <button
                    key={product.id}
                    onClick={() => selectProduct(product)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-brand/5 border-brand shadow-xs"
                        : "bg-white border-zinc-100 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 text-sm">
                        {product.name}
                      </span>
                      <span className="font-extrabold text-brand-dark text-sm">
                        ₱{product.sellingPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      {hasRecipe ? (
                        <span className="text-zinc-500">
                          {product.recipeItems.length} ingredient(s) • Cost:{" "}
                          <strong className="text-zinc-700">
                            ₱{currentCost.toFixed(2)}
                          </strong>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-warning font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> No recipe
                          mapped
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Recipe Editor & Live Margin Calculator */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedProduct ? (
            <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center">
              <ChefHat className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
              <p className="text-zinc-500 font-medium">
                Select a menu item on the left to build its recipe.
              </p>
            </div>
          ) : (
            <>
              {/* Cost & Profitability Summary Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">
                    Selling Price
                  </span>
                  <p className="text-xl font-extrabold text-zinc-900 mt-1">
                    ₱{sellingPrice.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">
                    Unit Food Cost
                  </span>
                  <p className="text-xl font-extrabold text-secondary mt-1">
                    ₱{totalFoodCost.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">
                    Gross Profit
                  </span>
                  <p
                    className={`text-xl font-extrabold mt-1 ${
                      grossProfit >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    ₱{grossProfit.toFixed(2)}
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-semibold text-zinc-400 uppercase">
                    Profit Margin
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p
                      className={`text-xl font-extrabold ${
                        profitMarginPercent >= 60
                          ? "text-success"
                          : profitMarginPercent >= 30
                            ? "text-primary"
                            : "text-danger"
                      }`}
                    >
                      {profitMarginPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Recipe Builder Card */}
              <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-zinc-900 font-['Montserrat']">
                      {selectedProduct.name} — Bill of Materials
                    </h2>
                    {maxServingsPossible !== null && (
                      <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-brand" />
                        Current stock supports up to{" "}
                        <strong className="text-brand-dark">
                          {maxServingsPossible} servings
                        </strong>
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand/10 text-brand font-semibold text-xs hover:bg-brand/20 transition-colors cursor-pointer self-start"
                  >
                    <Plus className="w-4 h-4" /> Add Ingredient / Packaging
                  </button>
                </div>

                {successMsg && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-success/10 border border-success/20 text-success flex items-center gap-2.5 text-sm font-semibold">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    {successMsg}
                  </div>
                )}

                {/* Ingredient Rows */}
                <div className="my-6 space-y-3">
                  {draftItems.length === 0 ? (
                    <div className="text-center py-10 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                      <Calculator className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500">
                        No ingredients linked yet. Click{" "}
                        <strong>"Add Ingredient / Packaging"</strong> to start.
                      </p>
                    </div>
                  ) : (
                    draftItems.map((row, idx) => {
                      const selectedIng = ingredients.find(
                        (i) => i.id === row.ingredientId,
                      );
                      const rowCost = selectedIng
                        ? selectedIng.costPerUnit * (Number(row.quantity) || 0)
                        : 0;

                      return (
                        <div
                          key={idx}
                          className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/70 items-center"
                        >
                          {/* Ingredient Dropdown */}
                          <div className="md:col-span-6">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                              Ingredient / Consumable
                            </label>
                            <select
                              value={row.ingredientId}
                              onChange={(e) =>
                                handleUpdateRow(
                                  idx,
                                  "ingredientId",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                            >
                              <option value="">Select item...</option>
                              {ingredients.map((ing) => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name} (₱{ing.costPerUnit.toFixed(2)} /{" "}
                                  {ing.unit})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Quantity Required per Serving */}
                          <div className="md:col-span-3">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                              Qty per Serving{" "}
                              {selectedIng ? `(${selectedIng.unit})` : ""}
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0.001"
                              value={row.quantity}
                              onChange={(e) =>
                                handleUpdateRow(
                                  idx,
                                  "quantity",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                            />
                          </div>

                          {/* Calculated Row Cost */}
                          <div className="md:col-span-2 text-right">
                            <span className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">
                              Line Cost
                            </span>
                            <span className="text-sm font-bold text-zinc-800">
                              ₱{rowCost.toFixed(2)}
                            </span>
                          </div>

                          {/* Delete Row */}
                          <div className="md:col-span-1 flex justify-end pt-4 md:pt-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="p-2 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={handleSaveRecipe}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving
                      ? "Saving Recipe..."
                      : "Save Recipe Configuration"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
