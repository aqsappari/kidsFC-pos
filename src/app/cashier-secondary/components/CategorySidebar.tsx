"use client";

import React from "react";
import { LayoutGrid } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  totalProductsCount: number;
  productCountsByCategory: Record<string, number>;
  isReadyForCheckout: boolean;
}

export function CategorySidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  totalProductsCount,
  productCountsByCategory,
  isReadyForCheckout,
}: CategorySidebarProps) {
  return (
    <div className="col-span-3 bg-white border-r border-zinc-200 p-3 sm:p-5 flex flex-col justify-between shrink-0 shadow-xs overflow-y-auto">
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Categories
          </label>
          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
            <button
              disabled={isReadyForCheckout}
              onClick={() => onSelectCategory("all")}
              className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all ${
                selectedCategory === "all"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              } disabled:opacity-50`}
            >
              <span className="flex items-center gap-2 truncate">
                <LayoutGrid className="w-4 h-4 shrink-0" />{" "}
                <span className="truncate">All Items</span>
              </span>
              <span className="text-[10px] opacity-80 bg-black/10 px-2 py-0.5 rounded-full shrink-0">
                {totalProductsCount}
              </span>
            </button>
            {categories.map((cat) => {
              const count = productCountsByCategory[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  disabled={isReadyForCheckout}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all ${
                    selectedCategory === cat.id
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                  } disabled:opacity-50`}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[10px] opacity-80 bg-black/10 px-2 py-0.5 rounded-full shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
