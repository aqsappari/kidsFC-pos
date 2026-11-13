"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  CheckCircle2,
  FolderPlus,
  ChefHat,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  getProductsPageData,
  createCategory,
  saveProduct,
  toggleProductAvailability,
} from "./actions";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  isAvailable: boolean;
  categoryId: string | null;
  category?: Category | null;
  recipeItems: { id: string }[];
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [successMsg, setSuccessMsg] = useState("");

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Form State for Product Add/Edit
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    sellingPrice: 0,
    isAvailable: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await getProductsPageData();
    setCategories(data.categories);
    setProducts(data.products);
  }

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      categoryId: categories.length > 0 ? categories[0].id : "",
      sellingPrice: 0,
      isAvailable: true,
    });
    setShowProductModal(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      categoryId: prod.categoryId || "",
      sellingPrice: prod.sellingPrice,
      isAvailable: prod.isAvailable,
    });
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveProduct({
      id: editingProduct ? editingProduct.id : undefined,
      name: formData.name,
      categoryId: formData.categoryId || null,
      sellingPrice: formData.sellingPrice,
      isAvailable: formData.isAvailable,
    });

    if (res.success) {
      setSuccessMsg(
        editingProduct
          ? "Menu item updated successfully!"
          : "New menu item created!",
      );
      setShowProductModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      alert(res.error || "Failed to save product.");
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const res = await createCategory(newCategoryName.trim());
    if (res.success) {
      setSuccessMsg("Category created successfully!");
      setNewCategoryName("");
      setShowCategoryModal(false);
      loadData();
      setTimeout(() => setSuccessMsg(""), 4000);
    } else {
      alert(res.error || "Failed to create category.");
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleProductAvailability(id, currentStatus);
    loadData();
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === "all" || item.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

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
              <UtensilsCrossed className="w-7 h-7 text-brand" /> Menu Products &
              Categories
            </h1>
            <p className="text-zinc-500 text-sm">
              Manage dishes, selling prices, categories, and POS availability
              status.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-secondary/10 text-secondary-dark font-semibold text-sm hover:bg-secondary/20 transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" /> Add Category
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-success/10 border border-success/20 text-success flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">{successMsg}</span>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-brand text-white shadow-xs"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? "bg-brand text-white shadow-xs"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-4 px-6">Product Name</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Selling Price</th>
                  <th className="py-4 px-6">Recipe Status</th>
                  <th className="py-4 px-6">POS Availability</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-sm">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-400">
                      No menu items found. Click "Add Menu Item" to get started.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((item) => {
                    const hasRecipe =
                      item.recipeItems && item.recipeItems.length > 0;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-zinc-50/60 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-zinc-900">
                          {item.name}
                        </td>
                        <td className="py-4 px-6 text-zinc-600">
                          <span className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary-dark font-medium text-xs">
                            {item.category?.name || "Uncategorized"}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-extrabold text-brand-dark">
                          ₱{item.sellingPrice.toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          {hasRecipe ? (
                            <span className="inline-flex items-center gap-1 text-success font-semibold text-xs">
                              <ChefHat className="w-3.5 h-3.5" /> Mapped
                            </span>
                          ) : (
                            <Link
                              href="/admin/recipes"
                              className="inline-flex items-center gap-1 text-warning font-semibold text-xs hover:underline"
                            >
                              ⚠️ Needs Recipe
                            </Link>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() =>
                              handleToggle(item.id, item.isAvailable)
                            }
                            className="inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            {item.isAvailable ? (
                              <span className="inline-flex items-center gap-1 text-success font-bold text-xs bg-success/10 px-2.5 py-1 rounded-full">
                                <ToggleRight className="w-4 h-4" /> Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-zinc-400 font-bold text-xs bg-zinc-100 px-2.5 py-1 rounded-full">
                                <ToggleLeft className="w-4 h-4" /> Hidden / Out
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors cursor-pointer inline-flex items-center"
                            title="Edit Menu Item"
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

      {/* Add / Edit Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-zinc-100">
            <h3 className="text-xl font-bold text-zinc-900 font-['Montserrat'] mb-4">
              {editingProduct ? "Edit Menu Item" : "Add New Menu Item"}
            </h3>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Cheeseburger, Iced Coffee, Fried Chicken"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                  Category
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand bg-white"
                >
                  <option value="">Select Category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                  Selling Price (₱)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.sellingPrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sellingPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-xs font-bold text-zinc-700 uppercase">
                  Available on POS Terminal
                </span>
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) =>
                    setFormData({ ...formData, isAvailable: e.target.checked })
                  }
                  className="w-5 h-5 accent-brand cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-brand/20"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm border border-zinc-100">
            <h3 className="text-xl font-bold text-zinc-900 font-['Montserrat'] mb-4">
              Add New Category
            </h3>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Burgers, Drinks, Desserts"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-semibold text-sm transition-colors cursor-pointer shadow-md shadow-brand/20"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
