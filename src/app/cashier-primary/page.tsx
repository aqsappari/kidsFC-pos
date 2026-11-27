"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  FileSpreadsheet,
  Radio,
  Layers,
  QrCode,
  Play,
  Pause,
  X,
  ExternalLink,
} from "lucide-react";
import {
  saveIndependentOrder,
  getActiveSessionData,
  restartSession,
  deleteActiveSessionOrder,
  exportSessionByDate,
} from "../cashier-actions";
import {
  KitchenReceiptModal,
  KitchenReceiptData,
} from "./components/KitchenReceiptModal";
import { CompletedReceiptModal } from "./components/CompletedReceiptModal";
import { TerminalSelector } from "./components/TerminalSelector";
import { TerminalDetailCard } from "./components/TerminalDetailCard";
import { SessionHistoryModal } from "./components/SessionHistoryModal";

export default function CashierPrimaryPage() {
  const [terminalsState, setTerminalsState] = useState<Record<string, any>>({});
  const [selectedTerminalId, setSelectedTerminalId] = useState<string>("");

  const [activeSession, setActiveSession] = useState<any>(null);
  const [cashTendered, setCashTendered] = useState<Record<string, string>>({});
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Kitchen Receipt Modal State
  const [kitchenReceipt, setKitchenReceipt] =
    useState<KitchenReceiptData | null>(null);

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showQuickLinks, setShowQuickLinks] = useState(false);
  const [exportDate, setExportDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // Serving Sequence Queue & Auto-Navigation
  const [servingQueue, setServingQueue] = useState<string[]>([]);
  const [isAutoNavigating, setIsAutoNavigating] = useState(true);

  // QR Code Modal State
  const [qrModalData, setQrModalData] = useState<{
    title: string;
    url: string;
  } | null>(null);

  const cashInputRef = useRef<HTMLInputElement>(null);
  const lastFocusedReadyKeyRef = useRef<string>("");

  // Memoize terminal keys to prevent infinite re-renders
  const terminalKeys = useMemo(
    () => Object.keys(terminalsState),
    [terminalsState],
  );

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const activeTerminalId =
    selectedTerminalId && terminalsState[selectedTerminalId]
      ? selectedTerminalId
      : terminalKeys[0] || "";

  const updateServerTerminalState = useCallback(
    async (terminalId: string, newState: any) => {
      setTerminalsState((prev) => ({ ...prev, [terminalId]: newState }));
      await fetch("/api/cart-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terminalId,
          token: terminalsState[terminalId]?.secretToken,
          ...newState,
        }),
      });
    },
    [terminalsState],
  );

  // Helper to open kitchen receipt for current terminal
  const openKitchenReceiptForActive = useCallback(() => {
    const tData = terminalsState[activeTerminalId];
    if (!tData || !tData.cart || tData.cart.length === 0) return;
    setKitchenReceipt({
      terminalId: activeTerminalId,
      tableNumber: tData.tableNumber || "Takeout / Walk-in",
      queueNumber: "NEW",
      timeOrdered: new Date(tData.updatedAt || Date.now()).toLocaleTimeString(),
      items: tData.cart.map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
      })),
    });
  }, [activeTerminalId, terminalsState]);

  // Update payment method helper for shortcut keys
  const setPaymentMethodForActive = useCallback(
    (method: string) => {
      if (!activeTerminalId || !terminalsState[activeTerminalId]) return;
      const tData = terminalsState[activeTerminalId];
      updateServerTerminalState(activeTerminalId, {
        ...tData,
        paymentMethod: method,
      });
    },
    [activeTerminalId, terminalsState, updateServerTerminalState],
  );

  // Keep latest values in a ref so the global keyboard listener never needs to re-bind
  const isAnyModalOpen = Boolean(
    kitchenReceipt || completedOrder || showSessionModal || qrModalData,
  );

  const hotkeysStateRef = useRef({
    terminalKeys,
    openKitchenReceiptForActive,
    setPaymentMethodForActive,
    isAnyModalOpen,
  });

  hotkeysStateRef.current = {
    terminalKeys,
    openKitchenReceiptForActive,
    setPaymentMethodForActive,
    isAnyModalOpen,
  };

  // Global Keyboard Shortcuts (Active only when NO modals are open)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const {
        terminalKeys: currentKeys,
        openKitchenReceiptForActive: openKitchen,
        setPaymentMethodForActive: setPayment,
        isAnyModalOpen: modalOpen,
      } = hotkeysStateRef.current;

      if (modalOpen) {
        return; // Bypass main page hotkeys when any modal is active
      }

      const target = e.target as HTMLElement;
      const isInputActive =
        ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable;

      const isCashInputFocused = target === cashInputRef.current;

      // ALT shortcuts for terminal switching (Alt + 1..9, 0 for 10)
      if (e.altKey) {
        let targetTableNum: string | null = null;
        if (e.key >= "1" && e.key <= "9") {
          targetTableNum = e.key;
        } else if (e.key === "0") {
          targetTableNum = "10";
        }

        if (targetTableNum) {
          e.preventDefault();
          const foundKey = currentKeys.find(
            (k) => k === `table-${targetTableNum}`,
          );
          if (foundKey) {
            setSelectedTerminalId(foundKey);
          }
          return;
        }
      }

      // If user is typing inside ANY input OTHER than the cash input, block hotkeys
      if (isInputActive && !isCashInputFocused) {
        return;
      }

      const key = e.key.toLowerCase();

      // Special terminal hotkeys
      if (key === "q") {
        e.preventDefault();
        const waiterKey = currentKeys.find(
          (k) =>
            k.toLowerCase().startsWith("waiter") ||
            k.toLowerCase().includes("server"),
        );
        if (waiterKey) setSelectedTerminalId(waiterKey);
      } else if (key === "w") {
        e.preventDefault();
        const emergencyKey = currentKeys.find((k) =>
          k.toLowerCase().includes("emergency"),
        );
        if (emergencyKey) setSelectedTerminalId(emergencyKey);
      }
      // Payment method hotkeys
      else if (key === "a") {
        e.preventDefault();
        setPayment("cash");
        setTimeout(() => {
          cashInputRef.current?.focus();
        }, 50);
      } else if (key === "s") {
        e.preventDefault();
        setPayment("gcash");
      } else if (key === "d") {
        e.preventDefault();
        setPayment("maya");
      } else if (key === "z") {
        e.preventDefault();
        setPayment("maribank");
      } else if (key === "x") {
        e.preventDefault();
        setPayment("card");
      }
      // Action hotkeys
      else if (key === "i") {
        e.preventDefault();
        cashInputRef.current?.focus();
      } else if (key === "k") {
        e.preventDefault();
        openKitchen();
      } else if (key === "e") {
        e.preventDefault();
        setShowSessionModal(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    loadSessionInfo();
    setExportDate(new Date().toISOString().split("T")[0]);

    const eventSource = new EventSource("/api/cart-sync?type=stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTerminalsState(data);
        const keys = Object.keys(data);
        if (keys.length > 0) {
          setSelectedTerminalId((prev) =>
            !prev || !data[prev] ? keys[0] : prev,
          );
        }
      } catch (err) {
        console.error("Failed to parse SSE state:", err);
      }
    };

    return () => eventSource.close();
  }, []);

  // Focus input ONCE when entering a ready terminal
  useEffect(() => {
    const currentTermData = terminalsState[selectedTerminalId];
    const isReady = Boolean(currentTermData?.isReadyForCheckout);
    const focusKey = isReady ? `${selectedTerminalId}:ready` : "";

    if (focusKey && lastFocusedReadyKeyRef.current !== focusKey) {
      lastFocusedReadyKeyRef.current = focusKey;
      setCashTendered((prev) => ({ ...prev, [selectedTerminalId]: "" }));
      const timer = setTimeout(() => cashInputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }

    if (!isReady) {
      lastFocusedReadyKeyRef.current = "";
    }
  }, [selectedTerminalId, terminalsState]);

  // SMART AUTO-NAVIGATION EFFECT
  useEffect(() => {
    const keys = Object.keys(terminalsState);

    setServingQueue((prevQueue) => {
      let changed = false;
      const nextQueue = [...prevQueue];

      keys.forEach((tId) => {
        const isReady = terminalsState[tId]?.isReadyForCheckout;
        const hasItems =
          terminalsState[tId]?.cart && terminalsState[tId].cart.length > 0;
        const inQueue = nextQueue.includes(tId);

        if ((isReady || hasItems) && !inQueue) {
          nextQueue.push(tId);
          changed = true;
        } else if (!isReady && !hasItems && inQueue) {
          const idx = nextQueue.indexOf(tId);
          if (idx > -1) {
            nextQueue.splice(idx, 1);
            changed = true;
          }
        }
      });

      return changed ? nextQueue : prevQueue;
    });

    if (!isAutoNavigating) return;
    if (!selectedTerminalId || !terminalsState[selectedTerminalId]) return;

    const currentTerminalData = terminalsState[selectedTerminalId];
    if (currentTerminalData?.isReadyForCheckout === true) return;
    if (currentTerminalData?.cart && currentTerminalData.cart.length > 0)
      return;

    const currentIndex = keys.indexOf(selectedTerminalId);
    const orderedKeys = [
      ...keys.slice(currentIndex + 1),
      ...keys.slice(0, currentIndex + 1),
    ];

    const readyMatch = orderedKeys.find(
      (tId) => terminalsState[tId]?.isReadyForCheckout === true,
    );
    if (readyMatch && readyMatch !== selectedTerminalId) {
      setSelectedTerminalId(readyMatch);
    }
  }, [terminalsState, isAutoNavigating, selectedTerminalId]);

  async function loadSessionInfo() {
    const session = await getActiveSessionData();
    setActiveSession(session);
  }

  const clearTerminalCart = async (terminalId: string) => {
    setCashTendered((prev) => ({ ...prev, [terminalId]: "" }));
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

    const subtotal = tData.cart.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0,
    );

    const rawCash =
      cashTendered[terminalId] !== undefined
        ? cashTendered[terminalId]
        : String(tData.cashTendered ?? "");

    const tenderedVal =
      tData.paymentMethod === "cash" ? parseFloat(rawCash) || 0 : subtotal;

    if (tData.paymentMethod === "cash" && tenderedVal < subtotal) {
      alert(
        `Cash tendered (₱${tenderedVal.toFixed(2)}) is less than total amount due (₱${subtotal.toFixed(2)})!`,
      );
      return;
    }

    setIsCheckingOut(terminalId);

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
      setCompletedOrder({
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
      });

      await clearTerminalCart(terminalId);
      loadSessionInfo();
      setShowSessionModal(false);
    } else {
      alert("Checkout failed.");
    }
  };

  const handleEmergencyEditOrder = async (ord: any) => {
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

    setCashTendered((prev) => ({
      ...prev,
      "emergency-edit": String(ord.totalAmount),
    }));
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoNavigating(!isAutoNavigating)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              isAutoNavigating
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200"
            }`}
          >
            {isAutoNavigating ? (
              <Play className="w-3.5 h-3.5" />
            ) : (
              <Pause className="w-3.5 h-3.5" />
            )}
            Auto-Nav: {isAutoNavigating ? "ON" : "OFF"}
          </button>

          <button
            onClick={() => setShowQuickLinks(!showQuickLinks)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              showQuickLinks
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            {showQuickLinks ? "Hide Links" : "Terminal Links"}
          </button>

          <button
            onClick={() => setShowSessionModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-4 h-4" /> Session & History (E)
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        {showQuickLinks && (
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs p-5 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Terminal Quick Links & QR Directory
              </h3>
              <button
                onClick={() => setShowQuickLinks(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {terminalKeys.map((tId) => {
                const tData = terminalsState[tId];
                const termUrl = `${origin}/cashier-secondary?u=${encodeURIComponent(tId)}${
                  tData?.secretToken
                    ? `&token=${encodeURIComponent(tData.secretToken)}`
                    : ""
                }`;
                const label = tId.startsWith("table-")
                  ? `Table ${tId.split("-")[1]}`
                  : tId;
                return (
                  <div
                    key={tId}
                    className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 flex flex-col justify-between gap-2 text-left"
                  >
                    <div className="truncate">
                      <span className="font-extrabold text-xs text-zinc-900 block truncate">
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-200">
                      <a
                        href={termUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Open
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
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

          <TerminalSelector
            terminalKeys={terminalKeys}
            terminalsState={terminalsState}
            activeTerminalId={activeTerminalId}
            onSelectTerminal={(tId) => setSelectedTerminalId(tId)}
          />

          <TerminalDetailCard
            activeTerminalId={activeTerminalId}
            currentTerminalData={terminalsState[activeTerminalId]}
            origin={origin}
            cashTenderedVal={
              cashTendered[activeTerminalId] !== undefined
                ? cashTendered[activeTerminalId]
                : terminalsState[activeTerminalId]?.cashTendered
                  ? String(terminalsState[activeTerminalId].cashTendered)
                  : ""
            }
            cashInputRef={cashInputRef}
            onOpenKitchenReceipt={openKitchenReceiptForActive}
            onOpenQrModal={(title, url) => setQrModalData({ title, url })}
            onClearCart={clearTerminalCart}
            onUpdateTerminalState={updateServerTerminalState}
            onCashChange={(tId, val) =>
              setCashTendered((prev) => ({ ...prev, [tId]: val }))
            }
            onCashBlur={(tId, val) =>
              updateServerTerminalState(tId, {
                ...terminalsState[tId],
                cashTendered: val,
              })
            }
            onCashKeyDown={(e, tId) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const tData = terminalsState[tId];
                if (!tData?.isReadyForCheckout) {
                  alert(
                    `Terminal [${tId}] has not flagged ready for checkout yet!`,
                  );
                  return;
                }
                handleCheckout(tId);
              }
            }}
            onCheckout={handleCheckout}
            isCheckingOut={isCheckingOut}
          />
        </div>
      </div>

      <KitchenReceiptModal
        receipt={kitchenReceipt}
        onClose={() => setKitchenReceipt(null)}
      />

      <CompletedReceiptModal
        completedOrder={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />

      <SessionHistoryModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        activeSession={activeSession}
        exportDate={exportDate}
        setExportDate={setExportDate}
        onExport={handleExport}
        isExporting={isExporting}
        onEmergencyEdit={handleEmergencyEditOrder}
        onPrintHistoryOrder={handlePrintHistoryOrder}
        onPrintKitchenOrder={(ord) => {
          setKitchenReceipt({
            terminalId: "history",
            tableNumber: ord.tableNumber || "Takeout / Walk-in",
            queueNumber: ord.queueNumber || "NEW",
            timeOrdered: ord.timestamp
              ? new Date(ord.timestamp).toLocaleTimeString()
              : new Date().toLocaleTimeString(),
            items: (ord.items || []).map((i: any) => ({
              name: i.name,
              quantity: i.quantity,
            })),
          });
        }}
        onDeleteOrder={handleDeleteSessionOrder}
        onRestartSession={async () => {
          if (
            confirm("Are you sure you want to clear active session orders?")
          ) {
            await restartSession();
            loadSessionInfo();
          }
        }}
      />
    </div>
  );
}
