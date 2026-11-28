"use client";

import React from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  originalPrice: number;
  quantity: number;
  maxStock?: number; // Optional stock cap passed from product/variant
}

interface CartContentProps {
  cart: CartItem[];
  clearCart: () => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  tableNumber: string;
  setTableNumber: (t: string) => void;
  paymentMethod: string;
  setPaymentMethod: (p: string) => void;
  subtotal: number;
  isReadyForCheckout: boolean;
  toggleReadyForCheckout: () => void;
  editingOrderId?: string;
  onCloseMobile?: () => void;
}

export function CartContent({
  cart,
  clearCart,
  updateQuantity,
  removeFromCart,
  tableNumber,
  setTableNumber,
  paymentMethod,
  setPaymentMethod,
  subtotal,
  isReadyForCheckout,
  toggleReadyForCheckout,
  editingOrderId,
  onCloseMobile,
}: CartContentProps) {
  const hasStockIssue = cart.some(
    (item) => item.maxStock !== undefined && item.quantity > item.maxStock,
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <div>
          <h2 className="font-bold text-zinc-950 font-['Montserrat'] flex items-center gap-2 text-sm sm:text-base">
            <ShoppingCart className="w-5 h-5 text-amber-600" /> Active Order
            Cart
          </h2>
          {editingOrderId && (
            <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-md mt-1 inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Emergency Edit: #
              {editingOrderId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {cart.length > 0 && !isReadyForCheckout && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
            <p className="text-sm font-medium">Cart is empty</p>
            <span className="text-xs">Select items from the catalog.</span>
          </div>
        ) : (
          cart.map((item) => {
            const atMaxStock =
              item.maxStock !== undefined && item.quantity >= item.maxStock;
            const overStock =
              item.maxStock !== undefined && item.quantity > item.maxStock;

            return (
              <div
                key={item.productId}
                className={`flex items-center justify-between p-3 rounded-2xl border ${
                  overStock
                    ? "bg-rose-50/70 border-rose-200"
                    : "bg-zinc-50 border-zinc-100"
                }`}
              >
                <div className="flex-1 pr-2">
                  <h4 className="font-bold text-zinc-900 text-xs line-clamp-2">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] mt-0.5">
                    <span className="font-bold text-amber-700">
                      ₱{item.unitPrice.toFixed(2)} each
                    </span>
                    {item.maxStock !== undefined && (
                      <span
                        className={`font-semibold text-[10px] ${
                          overStock
                            ? "text-rose-600 font-bold"
                            : "text-zinc-400"
                        }`}
                      >
                        ({item.maxStock} left)
                      </span>
                    )}
                  </div>
                  {overStock && (
                    <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                      Exceeds available stock!
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={isReadyForCheckout}
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center cursor-pointer hover:bg-zinc-100 disabled:opacity-50"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-xs w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    disabled={isReadyForCheckout || atMaxStock}
                    onClick={() => updateQuantity(item.productId, 1)}
                    title={
                      atMaxStock ? "Maximum available stock reached" : undefined
                    }
                    className="w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center cursor-pointer hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    disabled={isReadyForCheckout}
                    onClick={() => removeFromCart(item.productId)}
                    className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center cursor-pointer ml-1 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-zinc-100 bg-zinc-50 space-y-3 shrink-0">
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
            Dine-in / Takeout Selection <span className="text-rose-500">*</span>
          </label>
          <select
            disabled={isReadyForCheckout}
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-950 disabled:opacity-60"
          >
            <option value="" disabled>
              -- Select Dine-in or Takeout --
            </option>
            <option value="Takeout / Walk-in">Takeout / Walk-in</option>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={`Table ${i + 1}`}>
                Table {i + 1} (Dine-in)
              </option>
            ))}
          </select>
          {!tableNumber && (
            <p className="text-[10px] text-rose-600 font-semibold mt-1">
              Please select dine-in or takeout before flagging ready.
            </p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
            Payment Method
          </label>
          <div className="grid grid-cols-4 gap-1">
            {["cash", "gcash", "maya", "card"].map((m) => (
              <button
                key={m}
                disabled={isReadyForCheckout}
                onClick={() => setPaymentMethod(m)}
                className={`py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  paymentMethod === m
                    ? "bg-amber-600 text-white"
                    : "bg-white border border-zinc-200 text-zinc-700"
                } disabled:opacity-50`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-200 flex justify-between items-center text-lg font-extrabold">
          <span className="text-sm">Total Due:</span>
          <span className="text-amber-600">₱{subtotal.toFixed(2)}</span>
        </div>

        {hasStockIssue && (
          <p className="text-[11px] text-rose-600 font-bold text-center">
            Adjust quantities to match available stock before flagging ready.
          </p>
        )}

        <button
          onClick={toggleReadyForCheckout}
          disabled={cart.length === 0 || !tableNumber || hasStockIssue}
          className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md ${
            isReadyForCheckout
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
              : tableNumber && !hasStockIssue
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
          } disabled:opacity-55`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {isReadyForCheckout
            ? "Ready Flagged (Click to Unflag)"
            : "Flag Ready for Checkout"}
        </button>
      </div>
    </div>
  );
}
