"use client";

import React from "react";
import { ShoppingCart, ChevronUp } from "lucide-react";

interface MobileCartBarProps {
  totalItemsCount: number;
  subtotal: number;
  onOpenMobileCart: () => void;
}

export function MobileCartBar({
  totalItemsCount,
  subtotal,
  onOpenMobileCart,
}: MobileCartBarProps) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 shadow-2xl z-40 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
          {totalItemsCount}
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">
            Total Due
          </p>
          <p className="text-base font-extrabold text-amber-950">
            ₱{subtotal.toFixed(2)}
          </p>
        </div>
      </div>
      <button
        onClick={onOpenMobileCart}
        className="px-6 py-3 rounded-2xl bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
      >
        <ShoppingCart className="w-4 h-4" /> View Cart{" "}
        <ChevronUp className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
}
