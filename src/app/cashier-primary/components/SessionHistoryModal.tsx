"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  History,
  Download,
  AlertTriangle,
  Printer,
  Trash2,
  RefreshCw,
  X,
  ChefHat,
} from "lucide-react";

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: any;
  exportDate: string;
  setExportDate: (d: string) => void;
  onExport: () => void;
  isExporting: boolean;
  onEmergencyEdit: (ord: any) => void;
  onPrintHistoryOrder: (ord: any) => void;
  onPrintKitchenOrder: (ord: any) => void;
  onDeleteOrder: (orderId: string) => void;
  onRestartSession: () => void;
}

export function SessionHistoryModal({
  isOpen,
  onClose,
  activeSession,
  exportDate,
  setExportDate,
  onExport,
  isExporting,
  onEmergencyEdit,
  onPrintHistoryOrder,
  onPrintKitchenOrder,
  onDeleteOrder,
  onRestartSession,
}: SessionHistoryModalProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Ref map to store DOM references of each order card for auto-scrolling
  const orderItemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Sort orders descending (latest order first)
  const sortedOrders = useMemo(() => {
    if (!activeSession?.orders) return [];
    return [...activeSession.orders].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [activeSession?.orders]);

  // Keep latest refs to avoid stale closures in event listeners
  const sortedOrdersRef = useRef(sortedOrders);
  sortedOrdersRef.current = sortedOrders;

  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;

  // Reset selection to the latest order when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Auto-scroll when selectedIndex changes
  useEffect(() => {
    if (isOpen && orderItemRefs.current[selectedIndex]) {
      orderItemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedIndex, isOpen]);

  // Keyboard navigation & shortcuts inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isDateInputFocused = target === dateInputRef.current;
      const isInputActive = ["INPUT", "TEXTAREA", "SELECT"].includes(
        target.tagName,
      );

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (isDateInputFocused) {
        if (e.key === "Enter") {
          e.preventDefault();
          onExport();
        }
        return;
      }

      if (isInputActive) return;

      const key = e.key.toLowerCase();
      const currentOrders = sortedOrdersRef.current;
      const currentIndex = selectedIndexRef.current;

      if (key === "enter") {
        e.preventDefault();
        onExport();
      } else if (key === "d") {
        e.preventDefault();
        dateInputRef.current?.focus();
      } else if (key === "x") {
        e.preventDefault();
        onRestartSession();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(currentOrders.length - 1, prev + 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (currentOrders.length > 0) {
        const currentOrd = currentOrders[currentIndex];
        if (currentOrd) {
          if (key === "q") {
            e.preventDefault();
            onEmergencyEdit(currentOrd);
            onClose();
          } else if (key === "w") {
            e.preventDefault();
            onPrintKitchenOrder(currentOrd);
            onClose();
          } else if (key === "e") {
            e.preventDefault();
            onPrintHistoryOrder(currentOrd);
            onClose();
          } else if (key === "r") {
            e.preventDefault();
            onDeleteOrder(currentOrd.orderId);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    onClose,
    onExport,
    onRestartSession,
    onEmergencyEdit,
    onPrintKitchenOrder,
    onPrintHistoryOrder,
    onDeleteOrder,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-2xl border border-zinc-100 space-y-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 shrink-0">
          <h3 className="text-lg font-extrabold text-zinc-950 font-['Montserrat'] flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" /> Current Session
            History & Export
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 space-y-2">
            <span className="text-xs font-bold uppercase text-zinc-500 block">
              Export Session to Excel (Press{" "}
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-zinc-300">
                D
              </kbd>{" "}
              to focus date,{" "}
              <kbd className="bg-white px-1.5 py-0.5 rounded border border-zinc-300">
                Enter
              </kbd>{" "}
              to download)
            </span>
            <div className="flex items-center gap-3">
              <input
                ref={dateInputRef}
                type="date"
                value={exportDate}
                onChange={(e) => setExportDate(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                onClick={onExport}
                disabled={isExporting}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting
                  ? "Generating..."
                  : "Download Excel Report (Enter)"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
              <span>
                Recorded Orders ({sortedOrders.length}) — Latest First
              </span>
              <span className="text-[10px] font-normal text-zinc-400">
                ↑↓: Navigate | Q: Edit | W: Kitchen | E: Receipt | R: Delete
              </span>
            </h4>

            {sortedOrders.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <History className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                <p className="text-xs font-medium">
                  No orders completed yet in this session.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sortedOrders.map((ord, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={ord.orderId}
                      ref={(el) => {
                        orderItemRefs.current[idx] = el;
                      }}
                      onClick={() => setSelectedIndex(idx)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isSelected
                          ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm"
                          : "bg-white border-zinc-200 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                            Q#{ord.queueNumber}
                          </span>
                          <span className="text-xs font-bold text-zinc-700">
                            {ord.tableNumber}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md">
                            {ord.paymentMethod}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-600">
                          {ord.items
                            ?.map((i: any) => `${i.quantity}x ${i.name}`)
                            .join(", ")}
                        </p>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(ord.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100">
                        <span className="font-extrabold text-sm text-emerald-600">
                          ₱{ord.totalAmount.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEmergencyEdit(ord);
                              onClose();
                            }}
                            title="Emergency Edit Order (Q)"
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPrintKitchenOrder(ord);
                              onClose();
                            }}
                            title="Print Kitchen Receipt (W)"
                            className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer"
                          >
                            <ChefHat className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPrintHistoryOrder(ord);
                              onClose();
                            }}
                            title="Print Receipt (E)"
                            className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteOrder(ord.orderId);
                            }}
                            title="Delete Order (R)"
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 space-y-3">
            <span className="text-xs font-bold uppercase text-rose-700 block">
              Danger Zone
            </span>
            <p className="text-xs text-rose-600">
              Restarting session clears all completed orders in the active
              session file.
            </p>
            <button
              onClick={onRestartSession}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Restart / Reset Active
              Session (X)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
