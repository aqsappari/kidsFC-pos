"use client";

import React, { useEffect } from "react";
import { CheckCircle2, Printer, ChefHat } from "lucide-react";
import { printThermalReceipt } from "@/utils/printReceipt";
import { ReceiptView, ReceiptData } from "@/components/ReceiptView";

interface CompletedReceiptModalProps {
  completedOrder: ReceiptData | null;
  onClose: () => void;
}

export function CompletedReceiptModal({
  completedOrder,
  onClose,
}: CompletedReceiptModalProps) {
  useEffect(() => {
    if (!completedOrder) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        printThermalReceipt("thermal-receipt");
      } else if (key === "k") {
        e.preventDefault();
        printThermalReceipt("completed-kitchen-thermal-receipt");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [completedOrder, onClose]);

  if (!completedOrder) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-zinc-100 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-zinc-950 font-['Montserrat']">
            Order Receipt
          </h3>
          <p className="text-xs text-zinc-500">
            Queue #<strong>{completedOrder.queueNumber}</strong> |{" "}
            {completedOrder.tableNumber}
          </p>
        </div>

        <div className="max-h-64 overflow-y-auto">
          <ReceiptView order={completedOrder} id="thermal-receipt" />
        </div>

        {/* Hidden Kitchen Ticket DOM node ready for instant printing via 'K' or button click */}
        <div className="hidden" aria-hidden="true">
          <div
            id="completed-kitchen-thermal-receipt"
            className="bg-white p-4 rounded-2xl border border-black space-y-3 font-mono text-xs text-black"
          >
            <div className="text-center font-bold pb-2 border-b-2 border-black space-y-1">
              <div className="text-sm font-black tracking-wider uppercase">
                KITCHEN TICKET
              </div>
              <div className="badge-box py-1.5 px-3 rounded-md border-2 border-black bg-white text-black my-1 inline-block">
                <div className="text-base font-black uppercase">
                  {completedOrder.tableNumber || "Takeout / Walk-in"}
                </div>
                <div className="text-[11px] font-bold">
                  Queue #{completedOrder.queueNumber}
                </div>
              </div>
              <div className="text-[10px]">Time: {completedOrder.date}</div>
            </div>

            <div className="space-y-2 py-1">
              {completedOrder.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between font-bold text-xs border-b border-dashed border-zinc-300 pb-1"
                >
                  <span>{item.name}</span>
                  <span className="font-black text-sm">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() =>
                setTimeout(() => printThermalReceipt("thermal-receipt"), 50)
              }
              className="py-3 px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4 shrink-0" /> Complete (Enter)
            </button>
            <button
              onClick={() =>
                setTimeout(
                  () =>
                    printThermalReceipt("completed-kitchen-thermal-receipt"),
                  50,
                )
              }
              className="py-3 px-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <ChefHat className="w-4 h-4 shrink-0" /> Kitchen (K)
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}