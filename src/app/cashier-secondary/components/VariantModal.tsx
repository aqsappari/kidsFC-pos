"use client";

import React from "react";
import { X, Minus, Plus } from "lucide-react";
import {
  type GroupedProduct,
  type ProductVariant,
} from "../../cashier-actions";

interface VariantModalProps {
  variantModalProduct: GroupedProduct | null;
  onClose: () => void;
  modalQty: number;
  setModalQty: React.Dispatch<React.SetStateAction<number>>;
  onAddVariant: (
    product: GroupedProduct,
    variant: ProductVariant,
    qty: number,
  ) => void;
}

export function VariantModal({
  variantModalProduct,
  onClose,
  modalQty,
  setModalQty,
  onAddVariant,
}: VariantModalProps) {
  if (!variantModalProduct) return null;

  // Dependent variants share a single pool (e.g., Solo vs Meal from same chicken batch)
  // Independent variants have their own separate stock per variant (e.g., Bihon vs Togue)
  const isDependent =
    variantModalProduct.variants.length > 1 &&
    variantModalProduct.variants.every(
      (v) => v.stock === variantModalProduct.variants[0].stock,
    ) &&
    // Check if variants are named like Solo/Meal/Unli which typically share pool
    variantModalProduct.variants.some((v) =>
      ["solo", "meal", "unli", "standard"].includes(v.name.toLowerCase()),
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-zinc-100 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {variantModalProduct.category?.name}
              </span>

              {/* ONLY for DEPENDENT variants: stock badge on header */}
              {isDependent && (
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    variantModalProduct.stock > 5
                      ? "bg-emerald-50 text-emerald-700"
                      : variantModalProduct.stock > 0
                        ? "bg-amber-50 text-amber-700"
                        : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {variantModalProduct.stock > 0
                    ? `${variantModalProduct.stock} left`
                    : "Cook to order"}
                </span>
              )}
            </div>

            <h3 className="text-xl font-extrabold text-zinc-950 font-['Montserrat'] mt-2">
              {variantModalProduct.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Choose a variant option
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80">
          <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
            Quantity
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setModalQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-xl bg-white border border-zinc-200 text-zinc-800 flex items-center justify-center hover:bg-zinc-100 cursor-pointer shadow-xs"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-base w-6 text-center text-zinc-950">
              {modalQty}
            </span>
            <button
              type="button"
              onClick={() => setModalQty((q) => q + 1)}
              className="w-8 h-8 rounded-xl bg-white border border-zinc-200 text-zinc-800 flex items-center justify-center hover:bg-zinc-100 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Select Variant
          </label>
          {variantModalProduct.variants.map((variant) => {
            const price = variant.price;
            const lineTotal = price * modalQty;

            return (
              <button
                key={variant.id}
                type="button"
                onClick={() =>
                  onAddVariant(variantModalProduct, variant, modalQty)
                }
                className="w-full p-4 rounded-2xl bg-white hover:bg-amber-50 border-2 border-zinc-200 hover:border-amber-500 transition-all flex items-center justify-between text-left cursor-pointer group active:scale-[0.99]"
              >
                <div>
                  <span className="font-extrabold text-sm text-zinc-900 group-hover:text-amber-800 block">
                    {variant.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs mt-0.5">
                    <span className="text-amber-700 font-bold">
                      ₱{price.toFixed(2)} each
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* FOR INDEPENDENT VARIANTS: stock badge on its respective button card */}
                  {!isDependent && (
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl ${
                        variant.stock > 5
                          ? "bg-emerald-100 text-emerald-800"
                          : variant.stock > 0
                            ? "bg-amber-100 text-amber-800"
                            : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {variant.stock > 0
                        ? `${variant.stock} left`
                        : "Cook to order"}
                    </span>
                  )}

                  <span className="font-extrabold text-sm text-amber-700 bg-amber-100/80 px-3 py-1.5 rounded-xl hidden sm:inline-block">
                    + ₱{lineTotal.toFixed(2)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
