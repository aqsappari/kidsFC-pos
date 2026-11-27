"use client";

import React, { RefObject } from "react";
import {
  ShoppingCart,
  ChefHat,
  QrCode,
  ExternalLink,
  Unlock,
  Lock,
} from "lucide-react";

interface TerminalDetailCardProps {
  activeTerminalId: string;
  currentTerminalData: any;
  origin: string;
  cashTenderedVal: string;
  cashInputRef: RefObject<HTMLInputElement | null>;
  onOpenKitchenReceipt: () => void;
  onOpenQrModal: (title: string, url: string) => void;
  onClearCart: (tId: string) => void;
  onUpdateTerminalState: (tId: string, newState: any) => void;
  onCashChange: (tId: string, val: string) => void;
  onCashBlur: (tId: string, val: number) => void;
  onCashKeyDown: (
    e: React.KeyboardEvent,
    tId: string,
    subtotal: number,
  ) => void;
  onCheckout: (tId: string) => void;
  isCheckingOut: string | null;
}

export function TerminalDetailCard({
  activeTerminalId,
  currentTerminalData,
  origin,
  cashTenderedVal,
  cashInputRef,
  onOpenKitchenReceipt,
  onOpenQrModal,
  onClearCart,
  onUpdateTerminalState,
  onCashChange,
  onCashBlur,
  onCashKeyDown,
  onCheckout,
  isCheckingOut,
}: TerminalDetailCardProps) {
  if (!activeTerminalId || !currentTerminalData) {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center text-zinc-400">
        <p className="text-sm font-medium">
          Select a terminal above to inspect its active cart and checkout
          status.
        </p>
      </div>
    );
  }

  const tId = activeTerminalId;
  const tData = currentTerminalData;
  const isWaiter = tId.toLowerCase().startsWith("waiter");
  const isEmergency = tId.toLowerCase().includes("emergency");

  const secondaryTerminalUrl = `${origin}/cashier-secondary?u=${encodeURIComponent(
    tId,
  )}${tData.secretToken ? `&token=${encodeURIComponent(tData.secretToken)}` : ""}`;

  const cartItems = tData.cart || [];
  const subtotal = cartItems.reduce(
    (sum: number, item: any) => sum + item.unitPrice * item.quantity,
    0,
  );
  const tenderedVal = parseFloat(cashTenderedVal) || 0;
  const changeDue =
    tData.paymentMethod === "cash" ? Math.max(0, tenderedVal - subtotal) : 0;

  const labelTitle = isEmergency
    ? "Emergency Terminal"
    : isWaiter
      ? "Server Terminal"
      : tData.tableNumber || tId;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 shadow-md p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${
                isEmergency
                  ? "text-rose-800 bg-rose-50 border-rose-200"
                  : isWaiter
                    ? "text-indigo-800 bg-indigo-50 border-indigo-200"
                    : "text-emerald-800 bg-emerald-50 border-emerald-200"
              }`}
            >
              {isEmergency
                ? "🚨 Emergency Edit Terminal"
                : isWaiter
                  ? "Server Terminal"
                  : `Terminal ID: ${tId}`}
            </span>
            <span className="text-xs font-bold uppercase text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              {tData.tableNumber || "Not Selected"}
            </span>
            {tData.editingOrderId && (
              <span className="text-xs font-extrabold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-md">
                Editing Order #{tData.editingOrderId}
              </span>
            )}
          </div>
          <h3 className="text-lg font-extrabold text-zinc-950 mt-2">
            Cart Items ({cartItems.length})
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {cartItems.length > 0 && (
            <button
              onClick={onOpenKitchenReceipt}
              className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors cursor-pointer"
            >
              <ChefHat className="w-4 h-4" /> Kitchen Receipt
            </button>
          )}

          <button
            onClick={() => onOpenQrModal(labelTitle, secondaryTerminalUrl)}
            className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" /> Show QR
          </button>

          <a
            href={secondaryTerminalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Terminal
          </a>

          {tData.isReadyForCheckout ? (
            <span className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 animate-pulse">
              <Unlock className="w-4 h-4" /> Ready Flagged
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200">
              <Lock className="w-4 h-4" /> Locked (Unflagged)
            </span>
          )}
          {cartItems.length > 0 && (
            <button
              onClick={() => onClearCart(tId)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="py-16 text-center text-zinc-400">
          <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
          <p className="text-sm font-medium">Terminal [{tId}] cart is empty</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cartItems.map((item: any) => {
            const itemUnitPrice = item.unitPrice;
            const lineTotal = itemUnitPrice * item.quantity;
            return (
              <div
                key={item.productId}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-zinc-900 text-sm">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs mt-0.5">
                    <span className="font-bold text-emerald-600">
                      ₱{itemUnitPrice.toFixed(2)} each
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="font-bold text-sm text-zinc-700">
                    Qty: {item.quantity}
                  </span>
                  <span className="font-extrabold text-sm text-zinc-950">
                    ₱{lineTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cartItems.length > 0 && (
        <div className="pt-4 border-t border-zinc-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Payment Method
              </label>
              <div className="grid grid-cols-5 gap-2">
                {["cash", "gcash", "maya", "maribank", "card"].map((m) => (
                  <button
                    key={m}
                    onClick={() =>
                      onUpdateTerminalState(tId, {
                        ...tData,
                        paymentMethod: m,
                      })
                    }
                    className={`py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      tData.paymentMethod === m
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {tData.paymentMethod === "cash" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                    Cash Tendered
                  </label>
                  <input
                    ref={cashInputRef}
                    type="number"
                    placeholder="0.00"
                    value={cashTenderedVal}
                    onChange={(e) => onCashChange(tId, e.target.value)}
                    onBlur={(e) =>
                      onCashBlur(tId, parseFloat(e.target.value) || 0)
                    }
                    onKeyDown={(e) => onCashKeyDown(e, tId, subtotal)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-bold text-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                    Change Due
                  </label>
                  <div className="px-3 py-2 rounded-xl bg-zinc-200/70 border border-zinc-200 text-sm font-extrabold text-emerald-950 flex items-center">
                    ₱{changeDue.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs text-zinc-500 font-bold uppercase block">
                Total Amount Due
              </span>
              <span className="text-2xl font-extrabold text-emerald-600">
                ₱{subtotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => onCheckout(tId)}
              disabled={!tData.isReadyForCheckout || isCheckingOut === tId}
              className={`px-8 py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg ${
                tData.isReadyForCheckout
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer animate-pulse"
                  : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
              } disabled:opacity-60`}
            >
              {!tData.isReadyForCheckout
                ? "Awaiting Terminal Ready Flag..."
                : isCheckingOut === tId
                  ? "Processing Checkout..."
                  : `Complete Checkout (₱${subtotal.toFixed(2)})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
