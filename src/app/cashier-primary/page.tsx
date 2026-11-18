"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  CheckCircle2,
  Trash2,
  Printer,
  FileSpreadsheet,
  Layers,
  Radio,
  Lock,
  Unlock,
  X,
  RefreshCw,
  History,
  Download,
} from "lucide-react";
import {
  saveIndependentOrder,
  getActiveSessionData,
  restartSession,
  deleteActiveSessionOrder,
  exportSessionByDate,
} from "../cashier-xlsx/actions";
import { printThermalReceipt } from "@/utils/printReceipt";

export default function CashierPrimaryPage() {
  const [terminalsState, setTerminalsState] = useState<Record<number, any>>({});
  const [selectedTerminalId, setSelectedTerminalId] = useState<number>(1);

  const [activeSession, setActiveSession] = useState<any>(null);
  const [cashTendered, setCashTendered] = useState<Record<number, string>>({});
  const [isCheckingOut, setIsCheckingOut] = useState<number | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [exportDate, setExportDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadSessionInfo();
    setExportDate(new Date().toISOString().split("T")[0]);

    const eventSource = new EventSource("/api/cart-sync?type=stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTerminalsState(data);
      } catch (err) {
        console.error("Failed to parse SSE state:", err);
      }
    };

    return () => eventSource.close();
  }, []);

  async function loadSessionInfo() {
    const session = await getActiveSessionData();
    setActiveSession(session);
  }

  const updateServerTerminalState = async (
    terminalId: number,
    newState: any,
  ) => {
    const updated = { ...terminalsState, [terminalId]: newState };
    setTerminalsState(updated);
    await fetch("/api/cart-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terminalId, ...newState }),
    });
  };

  const clearTerminalCart = async (terminalId: number) => {
    await updateServerTerminalState(terminalId, {
      cart: [],
      tableNumber: "Takeout / Walk-in",
      paymentMethod: "cash",
      isReadyForCheckout: false,
    });
  };

  const handleCheckout = async (terminalId: number) => {
    const tData = terminalsState[terminalId];
    if (!tData || !tData.isReadyForCheckout) {
      alert(`Terminal #${terminalId} has not flagged ready for checkout yet!`);
      return;
    }
    if (tData.cart.length === 0) return;

    const tenderedVal = parseFloat(cashTendered[terminalId] || "0") || 0;
    const subtotal = tData.cart.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0,
    );

    if (tData.paymentMethod === "cash" && tenderedVal < subtotal) {
      alert(
        `Cash tendered is less than total amount due for Terminal #${terminalId}!`,
      );
      return;
    }

    setIsCheckingOut(terminalId);
    const res = await saveIndependentOrder({
      paymentMethod: tData.paymentMethod,
      tableNumber: tData.tableNumber,
      totalAmount: subtotal,
      items: tData.cart,
    });
    setIsCheckingOut(null);

    if (res.success) {
      setCompletedOrder({
        orderId: res.orderId,
        queueNumber: res.queueNumber,
        tableNumber: tData.tableNumber,
        total: subtotal,
        paymentMethod: tData.paymentMethod,
        cashTendered: tData.paymentMethod === "cash" ? tenderedVal : subtotal,
        changeDue:
          tData.paymentMethod === "cash"
            ? Math.max(0, tenderedVal - subtotal)
            : 0,
        date: new Date().toLocaleString(),
        items: [...tData.cart],
      });
      await clearTerminalCart(terminalId);
      loadSessionInfo();
    } else {
      alert("Checkout failed.");
    }
  };

  const handleRestartSession = async () => {
    if (confirm("Are you sure you want to clear the active session?")) {
      const res = await restartSession();
      if (res.success) {
        alert("Active session cleared successfully.");
        loadSessionInfo();
        setShowSessionModal(false);
      } else {
        alert("Failed to clear session.");
      }
    }
  };

  const handleDeleteSessionOrder = async (orderId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this order from the active session?",
      )
    ) {
      const res = await deleteActiveSessionOrder(orderId);
      if (res.success) {
        loadSessionInfo();
      } else {
        alert("Failed to delete order.");
      }
    }
  };

  const handleExportSession = async () => {
    setIsExporting(true);
    const res = await exportSessionByDate(exportDate);
    setIsExporting(false);

    if (res.success && res.fileData && res.fileName) {
      const blob = new Blob(
        [Uint8Array.from(atob(res.fileData), (c) => c.charCodeAt(0))],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowSessionModal(false);
    } else {
      alert(res.error || "Export failed.");
    }
  };

  return (
    <div className="h-screen bg-[#fdfbf7] flex flex-col font-sans overflow-hidden">
      {/* Navbar */}
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-zinc-950 font-['Montserrat'] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Cashier
            Primary (Terminals 1–10 Dashboard)
          </h1>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />{" "}
            Live Monitoring
          </span>
        </div>

        <button
          onClick={() => setShowSessionModal(true)}
          className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Layers className="w-4 h-4" /> Session & Export
        </button>
      </header>

      {/* Main Grid of 10 Terminals */}
      <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            Select Terminal (1 to 10) to Inspect & Checkout
          </h2>
          <span className="text-xs font-semibold text-zinc-500">
            Session Checkouts:{" "}
            <strong className="text-emerald-700">
              {activeSession?.orders?.length || 0}
            </strong>
          </span>
        </div>

        {/* Terminal Tabs Selector */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
          {Array.from({ length: 10 }, (_, i) => {
            const tId = i + 1;
            const tData = terminalsState[tId];
            const hasItems = tData?.cart?.length > 0;
            const isReady = tData?.isReadyForCheckout;
            const isSelected = selectedTerminalId === tId;

            return (
              <button
                key={tId}
                onClick={() => setSelectedTerminalId(tId)}
                className={`py-2.5 px-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex flex-col items-center gap-1 relative ${
                  isSelected
                    ? isReady
                      ? "bg-emerald-600 text-white shadow-lg ring-4 ring-emerald-400 animate-pulse"
                      : "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600"
                    : isReady
                      ? "bg-emerald-500 text-white shadow-lg ring-4 ring-emerald-300 animate-bounce"
                      : hasItems
                        ? "bg-amber-50 text-amber-900 border border-amber-300"
                        : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <span>T-{tId}</span>
                {hasItems && (
                  <span
                    className={`w-2 h-2 rounded-full ${isReady ? "bg-white animate-ping" : "bg-amber-500"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Terminal Details Card (Read-Only Items) */}
        {(() => {
          const tId = selectedTerminalId;
          const tData = terminalsState[tId] || {
            cart: [],
            tableNumber: "Takeout / Walk-in",
            paymentMethod: "cash",
            isReadyForCheckout: false,
          };
          const subtotal = tData.cart.reduce(
            (sum: number, item: any) => sum + item.unitPrice * item.quantity,
            0,
          );
          const tenderedVal = parseFloat(cashTendered[tId] || "0") || 0;
          const changeDue =
            tData.paymentMethod === "cash"
              ? Math.max(0, tenderedVal - subtotal)
              : 0;

          return (
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-md p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      Terminal #{tId}
                    </span>
                    <span className="text-xs font-bold uppercase text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      {tData.tableNumber}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-zinc-950 mt-2">
                    Cart Items ({tData.cart.length})
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {tData.isReadyForCheckout ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 animate-pulse">
                      <Unlock className="w-4 h-4" /> Ready Flagged
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold bg-rose-50 text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200">
                      <Lock className="w-4 h-4" /> Locked (Unflagged)
                    </span>
                  )}
                  {tData.cart.length > 0 && (
                    <button
                      onClick={() => clearTerminalCart(tId)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Clear Terminal Cart
                    </button>
                  )}
                </div>
              </div>

              {tData.cart.length === 0 ? (
                <div className="py-16 text-center text-zinc-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
                  <p className="text-sm font-medium">
                    Terminal #{tId} cart is empty
                  </p>
                  <span className="text-xs">
                    Staff can add items using `/cashier-secondary?u={tId}`
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {tData.cart.map((item: any) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100"
                    >
                      <div className="flex-1">
                        <h4 className="font-bold text-zinc-900 text-sm">
                          {item.name}
                        </h4>
                        <span className="text-xs text-zinc-500">
                          ₱{item.unitPrice.toFixed(2)} each
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-bold text-sm text-zinc-700">
                          Qty: {item.quantity}
                        </span>
                        <span className="font-extrabold text-sm text-zinc-950">
                          ₱{(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tData.cart.length > 0 && (
                <div className="pt-4 border-t border-zinc-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {["cash", "gcash", "maya", "card"].map((m) => (
                          <button
                            key={m}
                            onClick={() =>
                              updateServerTerminalState(tId, {
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
                            type="number"
                            placeholder="0.00"
                            value={cashTendered[tId] || ""}
                            onChange={(e) =>
                              setCashTendered({
                                ...cashTendered,
                                [tId]: e.target.value,
                              })
                            }
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
                      onClick={() => handleCheckout(tId)}
                      disabled={
                        !tData.isReadyForCheckout || isCheckingOut === tId
                      }
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
                          : `Complete Checkout T-${tId} (₱{subtotal.toFixed(2)})`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* SESSION MANAGEMENT & EXPORT MODAL WITH PRINT BUTTON IN HISTORY */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-xl border border-zinc-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h3 className="text-xl font-bold text-zinc-950 font-['Montserrat'] flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" /> Session & Export
                Control
              </h3>
              <button
                onClick={() => setShowSessionModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto pr-1 flex-1">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Active Session Info
                </span>
                <p className="text-sm font-bold text-zinc-900 mt-1">
                  Date:{" "}
                  {activeSession?.date ||
                    new Date().toISOString().split("T")[0]}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Checkouts recorded in current session:{" "}
                  <strong className="text-emerald-700">
                    {activeSession?.orders?.length || 0}
                  </strong>
                </p>

                <button
                  onClick={handleRestartSession}
                  className="mt-3 w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-amber-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Clear Active Session
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-600" /> Current
                    Session Orders
                  </span>
                  <span className="text-xs font-semibold text-zinc-500">
                    {activeSession?.orders?.length || 0} order(s)
                  </span>
                </div>

                {!activeSession?.orders || activeSession.orders.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-3 text-center italic">
                    No orders recorded in the current active session yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {activeSession.orders.map((ord: any, idx: number) => {
                      const printHistoryReceipt = () => {
                        setCompletedOrder({
                          orderId: ord.orderId,
                          queueNumber: ord.queueNumber,
                          tableNumber: ord.tableNumber,
                          total: ord.totalAmount,
                          paymentMethod: ord.paymentMethod,
                          cashTendered: ord.totalAmount,
                          changeDue: 0,
                          date: new Date(ord.timestamp).toLocaleString(),
                          items: ord.items,
                        });
                        setShowSessionModal(false);
                      };

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-white border border-zinc-200 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                Queue #{ord.queueNumber}
                              </span>
                              <span className="font-bold text-zinc-900">
                                {ord.tableNumber || "Takeout"}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500">
                              {ord.items
                                ?.map((i: any) => `${i.quantity}x ${i.name}`)
                                .join(", ")}
                            </p>
                            <span className="text-[10px] text-zinc-400 block">
                              {new Date(ord.timestamp).toLocaleTimeString()} • ₱
                              {ord.totalAmount.toFixed(2)} ({ord.paymentMethod})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={printHistoryReceipt}
                              className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-700 flex items-center justify-center hover:bg-zinc-200 cursor-pointer"
                              title="Print Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteSessionOrder(ord.orderId)
                              }
                              className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 cursor-pointer"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Export Current Session to Excel
                </span>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 uppercase mb-1">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={exportDate}
                    onChange={(e) => setExportDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-zinc-950"
                  />
                </div>

                <button
                  onClick={handleExportSession}
                  disabled={isExporting}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  {isExporting
                    ? "Generating Excel..."
                    : "Download Active Session XLSX"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL & THERMAL RECEIPT */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center border border-zinc-100">
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-zinc-950 font-['Montserrat']">
                Order Receipt
              </h3>
              <div className="flex justify-center gap-2 my-2">
                <div className="py-2 px-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">
                    Queue No.
                  </span>
                  <span className="text-2xl font-extrabold text-amber-950">
                    #{completedOrder.queueNumber}
                  </span>
                </div>
                <div className="py-2 px-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Table
                  </span>
                  <span className="text-lg font-extrabold text-emerald-950">
                    {completedOrder.tableNumber}
                  </span>
                </div>
              </div>
            </div>

            <div
              id="thermal-receipt"
              className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 mb-5 text-left font-mono text-xs text-zinc-900"
            >
              <div className="text-center border-b border-dashed border-zinc-400 pb-2 mb-2">
                <p className="font-bold text-sm uppercase">ORDER LIST</p>
                <p className="text-base font-extrabold text-black mt-1">
                  QUEUE #: {completedOrder.queueNumber}
                </p>
                <p className="text-sm font-bold text-emerald-800">
                  LOCATION: {completedOrder.tableNumber}
                </p>
              </div>

              <div className="space-y-2 border-b border-dashed border-zinc-400 pb-2 mb-2">
                {completedOrder.items.map((it: any, i: number) => (
                  <div key={i} className="flex flex-col text-[11px]">
                    <span className="font-bold text-black">{it.name}</span>
                    <div className="pl-2 flex justify-between text-zinc-700">
                      <span>
                        Qty: {it.quantity} × ₱{it.unitPrice.toFixed(2)}
                      </span>
                      <span className="font-bold">
                        ₱{(it.unitPrice * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold text-xs">
                  <span>TOTAL:</span>
                  <span>₱{completedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between uppercase">
                  <span>Payment ({completedOrder.paymentMethod}):</span>
                  <span>₱{completedOrder.cashTendered.toFixed(2)}</span>
                </div>
                <div className="flex justify-between uppercase">
                  <span>CHANGE:</span>
                  <span>
                    ₱
                    {completedOrder.cashTendered.toFixed(2) -
                      completedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => printThermalReceipt("thermal-receipt")}
                className="flex-1 py-3 rounded-2xl bg-zinc-800 text-white font-semibold text-sm hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
