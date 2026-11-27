"use client";

import React, { useEffect } from "react";
import { CheckCircle2, Printer } from "lucide-react";
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
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        printThermalReceipt("thermal-receipt");
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

        <div className="flex gap-3 pt-2">
          <button
            onClick={() =>
              setTimeout(() => printThermalReceipt("thermal-receipt"), 50)
            }
            className="flex-1 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Receipt (Enter)
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
