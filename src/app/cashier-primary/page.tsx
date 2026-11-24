"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
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
  ExternalLink,
  QrCode,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  saveIndependentOrder,
  getActiveSessionData,
  restartSession,
  deleteActiveSessionOrder,
  exportSessionByDate,
} from "../cashier-actions";
import { printThermalReceipt } from "@/utils/printReceipt";
import { ReceiptView } from "@/components/ReceiptView";

export default function CashierPrimaryPage() {
  const [terminalsState, setTerminalsState] = useState<Record<string, any>>({});
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>("");

  const [activeSession, setActiveSession] = useState<any>(null);
  const [cashTendered, setCashTendered] = useState<Record<string, string>>({});
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [exportDate, setExportDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // QR Code Modal State
  const [qrModalData, setQrModalData] = useState<{
    title: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    loadSessionInfo();
    setExportDate(new Date().toISOString().split("T")[0]);

    const eventSource = new EventSource("/api/cart-sync?type=stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTerminalsState(data);
        const keys = Object.keys(data);
        if (
          keys.length > 0 &&
          (!selectedTerminalId || !data[selectedTerminalId])
        ) {
          setSelectedTerminalId(keys[0]);
        }
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
    terminalId: string,
    newState: any,
  ) => {
    const updated = { ...terminalsState, [terminalId]: newState };
    setTerminalsState(updated);
    await fetch("/api/cart-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        terminalId,
        token: terminalsState[terminalId]?.secretToken,
        ...newState,
      }),
    });
  };

  const clearTerminalCart = async (terminalId: string) => {
    await updateServerTerminalState(terminalId, {
      ...terminalsState[terminalId],
      cart: [],
      tableNumber: "",
      paymentMethod: "cash",
      cashTendered: 0,
      changeDue: 0,
      isReadyForCheckout: false,
      editingOrderId: undefined,
      resetTerminal: true,
    });
  };

  const handleCheckout = async (terminalId: string) => {
    const tData = terminalsState[terminalId];
    if (!tData || !tData.isReadyForCheckout) {
      alert(`Terminal [${terminalId}] has not flagged ready for checkout yet!`);
      return;
    }
    if (tData.cart.length === 0) return;

    const tenderedVal =
      tData.paymentMethod === "cash"
        ? parseFloat(cashTendered[terminalId] ?? tData.cashTendered) || 0
        : tData.cart.reduce(
            (sum: number, item: any) => sum + item.unitPrice * item.quantity,
            0,
          );

    const subtotal = tData.cart.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0,
    );

    if (tData.paymentMethod === "cash" && tenderedVal < subtotal) {
      alert(
        `Cash tendered is less than total amount due for Terminal [${terminalId}]!`,
      );
      return;
    }

    setIsCheckingOut(terminalId);

    // If this checkout is from an emergency edit, remove the old order first
    if (tData.editingOrderId) {
      await deleteActiveSessionOrder(tData.editingOrderId);
    }

    const res = await saveIndependentOrder({
      paymentMethod: tData.paymentMethod,
      tableNumber: tData.tableNumber || "Takeout / Walk-in",
      totalAmount: subtotal,
      items: tData.cart,
    });
    setIsCheckingOut(null);

    if (res.success) {
      const newCompleted = {
        orderId: res.orderId,
        queueNumber: res.queueNumber,
        tableNumber: tData.tableNumber || "Takeout / Walk-in",
        total: subtotal,
        paymentMethod: tData.paymentMethod,
        cashTendered: tenderedVal,
        changeDue:
          tData.paymentMethod === "cash"
            ? Math.max(0, tenderedVal - subtotal)
            : 0,
        date: new Date().toLocaleString(),
        items: tData.cart,
      };
      setCompletedOrder(newCompleted);
      await clearTerminalCart(terminalId);
      loadSessionInfo();
      setShowSessionModal(false);
    } else {
      alert("Checkout failed.");
    }
  };

  const handleEmergencyEditOrder = async (ord: any) => {
    // Load the order items and details into emergency-edit terminal state
    const emergencyToken =
      terminalsState["emergency-edit"]?.secretToken || "emergency_sec_pass77";
    const mappedCart = ord.items.map((i: any) => ({
      productId:
        i.productId ||
        "xlsx_item_" + Math.random().toString(36).substring(2, 6),
      name: i.name,
      unitPrice: i.unitPrice,
      originalPrice: i.unitPrice,
      quantity: i.quantity,
    }));

    await updateServerTerminalState("emergency-edit", {
      cart: mappedCart,
      tableNumber: ord.tableNumber,
      paymentMethod: ord.paymentMethod || "cash",
      cashTendered: ord.totalAmount,
      changeDue: 0,
      isReadyForCheckout: false,
      editingOrderId: ord.orderId,
    });

    setCashTendered({
      ...cashTendered,
      "emergency-edit": String(ord.totalAmount),
    });
    setSelectedTerminalId("emergency-edit");
    setShowSessionModal(false);
  };

  const handleDeleteSessionOrder = async (orderId: string) => {
    if (
      confirm("Are you sure you want to delete this order from the session?")
    ) {
      await deleteActiveSessionOrder(orderId);
      loadSessionInfo();
    }
  };

  const handlePrintHistoryOrder = (ord: any) => {
    setCompletedOrder({
      orderId: ord.orderId,
      queueNumber: ord.queueNumber,
      tableNumber: ord.tableNumber,
      total: ord.totalAmount,
      paymentMethod: ord.paymentMethod,
      cashTendered: ord.totalAmount,
      changeDue: 0,
      date: ord.timestamp
        ? new Date(ord.timestamp).toLocaleString()
        : new Date().toLocaleString(),
      items: ord.items,
    });
  };

  const handleExport = async () => {
    if (!exportDate) return;
    setIsExporting(true);
    const res = await exportSessionByDate(exportDate);
    setIsExporting(false);

    if (res.success && res.fileData && res.fileName) {
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.fileData}`;
      link.download = res.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert(res.error || "Export failed.");
    }
  };

  const handleRestartSession = async () => {
    if (
      confirm(
        "Are you sure you want to clear active session orders and start fresh?",
      )
    ) {
      await restartSession();
      loadSessionInfo();
    }
  };

  const terminalKeys = Object.keys(terminalsState);

  return (
    <div className="h-screen bg-[#fdfbf7] flex flex-col font-sans overflow-hidden">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-zinc-950 font-['Montserrat'] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Cashier
            Primary Dashboard
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
          <Layers className="w-4 h-4" /> Session & History
        </button>
      </header>

      <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            Active Terminals & Tables ({terminalKeys.length})
          </h2>
          <span className="text-xs font-semibold text-zinc-500">
            Session Checkouts:{" "}
            <strong className="text-emerald-700">
              {activeSession?.orders?.length || 0}
            </strong>
          </span>
        </div>

        {/* Terminal Buttons Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {terminalKeys.map((tId) => {
            const tData = terminalsState[tId];
            const hasItems = tData?.cart?.length > 0;
            const isReady = tData?.isReadyForCheckout;
            const isSelected = selectedTerminalId === tId;
            const isWaiter = tId.toLowerCase().startsWith("waiter");
            const isEmergency = tId.toLowerCase().includes("emergency");

            const buttonLabel = isEmergency
              ? "🚨 Emergency Edit"
              : isWaiter
                ? "Server / Waiter 1"
                : tId.startsWith("table-")
                  ? `Table ${tId.split("-")[1]}`
                  : tId;

            return (
              <button
                key={tId}
                onClick={() => setSelectedTerminalId(tId)}
                className={`py-3 px-4 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
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
                <span>{buttonLabel}</span>
                {hasItems && (
                  <span
                    className={`w-2 h-2 rounded-full ${isReady ? "bg-white animate-ping" : "bg-amber-500"}`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Terminal Details */}
        {selectedTerminalId &&
          terminalsState[selectedTerminalId] &&
          (() => {
            const tId = selectedTerminalId;
            const tData = terminalsState[tId];
            const isWaiter = tId.toLowerCase().startsWith("waiter");
            const isEmergency = tId.toLowerCase().includes("emergency");

            const origin =
              typeof window !== "undefined" ? window.location.origin : "";
            const secondaryTerminalUrl = `${origin}/cashier-secondary?u=${encodeURIComponent(
              tId,
            )}${
              tData.secretToken
                ? `&token=${encodeURIComponent(tData.secretToken)}`
                : ""
            }`;

            const subtotal = tData.cart.reduce(
              (sum: number, item: any) => sum + item.unitPrice * item.quantity,
              0,
            );
            const tenderedVal =
              parseFloat(cashTendered[tId] ?? tData.cashTendered ?? "0") || 0;
            const changeDue =
              tData.paymentMethod === "cash"
                ? Math.max(0, tenderedVal - subtotal)
                : 0;

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
                      Cart Items ({tData.cart.length})
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setQrModalData({
                          title: isEmergency
                            ? "Emergency Terminal"
                            : isWaiter
                              ? "Server Terminal"
                              : tData.tableNumber || tId,
                          url: secondaryTerminalUrl,
                        })
                      }
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
                    {tData.cart.length > 0 && (
                      <button
                        onClick={() => clearTerminalCart(tId)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>
                </div>

                {tData.cart.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
                    <p className="text-sm font-medium">
                      Terminal [{tId}] cart is empty
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tData.cart.map((item: any) => {
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
                              value={
                                cashTendered[tId] ?? tData.cashTendered ?? ""
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                setCashTendered({
                                  ...cashTendered,
                                  [tId]: val,
                                });
                                updateServerTerminalState(tId, {
                                  ...tData,
                                  cashTendered: parseFloat(val) || 0,
                                });
                              }}
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
                            : `Complete Checkout (₱${subtotal.toFixed(2)})`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
      </div>

      {/* QR CODE POPUP MODAL */}
      {qrModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setQrModalData(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center border border-zinc-100 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="text-base font-extrabold text-zinc-950 font-['Montserrat']">
                Scan for {qrModalData.title}
              </h3>
              <button
                onClick={() => setQrModalData(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200 flex justify-center">
              <QRCodeSVG value={qrModalData.url} size={200} level="H" />
            </div>

            <p className="text-[11px] text-zinc-500 break-all px-2 font-mono bg-zinc-100 py-2 rounded-xl">
              {qrModalData.url}
            </p>

            <button
              onClick={() => setQrModalData(null)}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* SESSION & HISTORY MODAL */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-2xl border border-zinc-100 space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 shrink-0">
              <h3 className="text-lg font-extrabold text-zinc-950 font-['Montserrat'] flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" /> Current Session
                History & Export
              </h3>
              <button
                onClick={() => setShowSessionModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200/80 space-y-2">
                <span className="text-xs font-bold uppercase text-zinc-500 block">
                  Export Session to Excel
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    value={exportDate}
                    onChange={(e) => setExportDate(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-950"
                  />
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {isExporting ? "Generating..." : "Download Excel Report"}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Recorded Orders ({activeSession?.orders?.length || 0})
                  </h4>
                </div>

                {!activeSession?.orders || activeSession.orders.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <History className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                    <p className="text-xs font-medium">
                      No orders completed yet in this session.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeSession.orders.map((ord: any) => (
                      <div
                        key={ord.orderId}
                        className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
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
                              onClick={() => handleEmergencyEditOrder(ord)}
                              title="Emergency Edit Order"
                              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handlePrintHistoryOrder(ord)}
                              title="Print Receipt"
                              className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 cursor-pointer"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteSessionOrder(ord.orderId)
                              }
                              title="Delete Order"
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  onClick={handleRestartSession}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Restart / Reset Active
                  Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETED ORDER RECEIPT MODAL */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-zinc-100 space-y-6">
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
                <Printer className="w-4 h-4" /> Print Thermal Receipt
              </button>
              <button
                onClick={() => setCompletedOrder(null)}
                className="px-6 py-3 rounded-2xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
