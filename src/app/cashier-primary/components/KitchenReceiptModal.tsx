"use client";

import React, { useEffect } from "react";
import { ChefHat, Printer, X } from "lucide-react";
import { printThermalReceipt } from "@/utils/printReceipt";

export interface KitchenReceiptData {
  terminalId: string;
  tableNumber: string;
  queueNumber: string | number;
  timeOrdered: string;
  items: Array<{ name: string; quantity: number }>;
}

interface KitchenReceiptModalProps {
  receipt: KitchenReceiptData | null;
  onClose: () => void;
}

export function KitchenReceiptModal({
  receipt,
  onClose,
}: KitchenReceiptModalProps) {
  useEffect(() => {
    if (!receipt) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        e.preventDefault();
        printThermalReceipt("kitchen-thermal-receipt");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [receipt, onClose]);

  if (!receipt) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-zinc-100 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-extrabold text-zinc-950 font-['Montserrat']">
              Kitchen Order Ticket
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Print View Container */}
        <div
          id="kitchen-thermal-receipt"
          className="bg-white p-4 rounded-2xl border border-black space-y-3 font-mono text-xs text-black"
        >
          <div className="text-center font-bold pb-2 border-b-2 border-black space-y-1">
            <div className="text-sm font-black tracking-wider uppercase">
              KITCHEN TICKET
            </div>
            <div className="badge-box py-1.5 px-3 rounded-md border-2 border-black bg-white text-black my-1 inline-block">
              <div className="text-base font-black uppercase">
                {receipt.tableNumber}
              </div>
            </div>
            <div className="text-[10px]">Time: {receipt.timeOrdered}</div>
          </div>

          <div className="space-y-2 py-1">
            {receipt.items.map((item, idx) => (
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

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => printThermalReceipt("kitchen-thermal-receipt")}
            className="flex-1 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Ticket (Enter)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
