"use client";

import React, { RefObject } from "react";
import { Plus, Layers } from "lucide-react";
import { type GroupedProduct } from "../../cashier-actions";

interface CatalogGridProps {
  products: GroupedProduct[];
  isReadyForCheckout: boolean;
  onProductClick: (product: GroupedProduct) => void;
  catalogScrollRef: RefObject<HTMLDivElement | null>;
}

export function CatalogGrid({
  products,
  isReadyForCheckout,
  onProductClick,
  catalogScrollRef,
}: CatalogGridProps) {
  return (
    <div
      ref={catalogScrollRef}
      className="col-span-9 lg:col-span-6 px-4 sm:px-6 pt-6 flex flex-col h-full overflow-y-auto pb-24 lg:pb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-zinc-950 text-xs sm:text-sm uppercase tracking-wider font-['Montserrat']">
          Catalog Items ({products.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {products.map((prod) => {
          const hasVariants = prod.variants && prod.variants.length > 1;
          const minPrice = prod.sellingPrice;
          const maxPrice = hasVariants
            ? Math.max(...prod.variants.map((v) => v.price))
            : minPrice;

          const hasPriceRange = hasVariants && maxPrice > minPrice;

          return (
            <button
              key={prod.id}
              disabled={isReadyForCheckout}
              onClick={() => onProductClick(prod)}
              className="group flex flex-col justify-between p-3.5 sm:p-4 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 hover:border-amber-500 shadow-xs transition-all text-left cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase truncate">
                    {prod.category?.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        prod.stock > 5
                          ? "bg-emerald-50 text-emerald-700"
                          : prod.stock > 0
                            ? "bg-amber-50 text-amber-700"
                            : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {prod.stock > 0 ? `${prod.stock} left` : "Cook to order"}
                    </span>
                    {hasVariants && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase">
                        <Layers className="w-2.5 h-2.5" />{" "}
                        {prod.variants.length}
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-zinc-900 text-xs sm:text-sm mt-1 group-hover:text-amber-600 line-clamp-2">
                  {prod.name}
                </h3>
              </div>
              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  {hasPriceRange ? (
                    <span className="font-extrabold text-zinc-950 text-xs sm:text-sm text-amber-700">
                      ₱{minPrice.toFixed(0)}–₱{maxPrice.toFixed(0)}
                    </span>
                  ) : (
                    <span className="font-extrabold text-zinc-950 text-xs sm:text-base text-amber-700">
                      ₱{minPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white">
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
