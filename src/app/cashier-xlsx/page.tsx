"use client";

import { useState, useEffect, useRef } from "react";
import {
  UtensilsCrossed,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Search,
  RotateCcw,
  LayoutGrid,
  Printer,
  FileSpreadsheet,
  X,
  ChevronUp,
  RefreshCw,
  Download,
  Layers,
  Maximize,
  Minimize,
  History,
  Radio,
} from "lucide-react";
import {
  getIndependentMenuData,
  saveIndependentOrder,
  getActiveSessionData,
  restartSession,
  deleteActiveSessionOrder,
  exportSessionByDate,
} from "./actions";
import { printThermalReceipt } from "@/utils/printReceipt";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  categoryId: string;
  category: Category;
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

interface CartContentProps {
  cart: CartItem[];
  clearCart: () => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  paymentMethod: string;
  setPaymentMethod: (m: string) => void;
  tableNumber: string;
  setTableNumber: (t: string) => void;
  cashTendered: string;
  setCashTendered: (val: string) => void;
  changeDue: number;
  subtotal: number;
  handleCheckout: () => void;
  isCheckingOut: boolean;
  onCloseMobile?: () => void;
}

function CartContent({
  cart,
  clearCart,
  updateQuantity,
  removeFromCart,
  paymentMethod,
  setPaymentMethod,
  tableNumber,
  setTableNumber,
  cashTendered,
  setCashTendered,
  changeDue,
  subtotal,
  handleCheckout,
  isCheckingOut,
  onCloseMobile,
}: CartContentProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-zinc-950 font-['Montserrat'] flex items-center gap-2 text-sm sm:text-base">
          <ShoppingCart className="w-5 h-5 text-emerald-600" /> Current Order
        </h2>
        <div className="flex items-center gap-3">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
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
            <span className="text-xs">
              Click any Excel item to start an order.
            </span>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100"
            >
              <div className="flex-1 pr-2">
                <h4 className="font-bold text-zinc-900 text-xs line-clamp-1">
                  {item.name}
                </h4>
                <span className="text-[11px] text-zinc-500">
                  ₱{item.unitPrice.toFixed(2)} each
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQuantity(item.productId, -1)}
                  className="w-6 h-6 rounded-lg bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center hover:bg-zinc-100 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-xs w-4 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.productId, 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center hover:bg-zinc-100 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 cursor-pointer ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-zinc-100 bg-zinc-50 space-y-3 shrink-0">
        {/* Table Selection Grid (Takeout + Tables 1-10) */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">
            Table / Order Type
          </label>
          <div className="grid grid-cols-6 gap-1">
            <button
              type="button"
              onClick={() => setTableNumber("Takeout / Walk-in")}
              className={`col-span-2 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                tableNumber === "Takeout / Walk-in"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              Takeout
            </button>
            {Array.from({ length: 10 }, (_, i) => {
              const label = `Table ${i + 1}`;
              const isSelected = tableNumber === label;
              return (
                <button
                  key={i + 1}
                  type="button"
                  onClick={() => setTableNumber(label)}
                  className={`py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
            Payment Method
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {["cash", "gcash", "maya", "card"].map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  paymentMethod === m
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {paymentMethod === "cash" && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                Cash Tendered
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-zinc-950"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                Change Due
              </label>
              <div className="px-3 py-1.5 rounded-xl bg-zinc-200/70 border border-zinc-200 text-xs font-extrabold text-emerald-950 flex items-center">
                ₱{changeDue.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-zinc-200/60 flex justify-between items-center text-lg font-extrabold text-zinc-900">
          <span className="text-sm">Total Due:</span>
          <span className="text-emerald-600">₱{subtotal.toFixed(2)}</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || isCheckingOut}
          className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
        >
          {isCheckingOut
            ? "Processing..."
            : `Complete Order (₱${subtotal.toFixed(2)})`}
        </button>
      </div>
    </div>
  );
}

export default function IndependentExcelCashierPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tableNumber, setTableNumber] = useState("Takeout / Walk-in");
  const [cashTendered, setCashTendered] = useState<string>("");

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Session & Export State
  const [activeSession, setActiveSession] = useState<any>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [exportDate, setExportDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const catalogScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadExcelData();
    loadSessionInfo();
    setExportDate(new Date().toISOString().split("T")[0]);

    // Setup Real-time SSE Connection for synchronization
    const eventSource = new EventSource("/api/cart-sync?type=stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.cart) setCart(data.cart);
        if (data.tableNumber) setTableNumber(data.tableNumber);
        if (data.paymentMethod) setPaymentMethod(data.paymentMethod);
      } catch (err) {
        console.error("Failed to parse SSE cart update:", err);
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      eventSource.close();
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  async function loadExcelData() {
    const data = await getIndependentMenuData();
    setCategories(data.categories);
    setProducts(data.products);
  }

  async function loadSessionInfo() {
    const session = await getActiveSessionData();
    setActiveSession(session);
  }

  useEffect(() => {
    if (catalogScrollRef.current) {
      catalogScrollRef.current.scrollTop = 0;
    }
  }, [selectedCategory, searchQuery]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Broadcast cart updates to the real-time API
  const updateSharedCartOnServer = async (
    newCart: CartItem[],
    newTable = tableNumber,
    newPayment = paymentMethod,
  ) => {
    setCart(newCart);
    await fetch("/api/cart-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cart: newCart,
        tableNumber: newTable,
        paymentMethod: newPayment,
      }),
    });
  };

  const addToCart = async (product: Product) => {
    let updatedCart = [...cart];
    const existing = updatedCart.find((item) => item.productId === product.id);
    if (existing) {
      updatedCart = updatedCart.map((item) =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      );
    } else {
      updatedCart.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.sellingPrice,
        quantity: 1,
      });
    }
    await updateSharedCartOnServer(updatedCart);
  };

  const updateQuantity = async (productId: string, delta: number) => {
    const updatedCart = cart
      .map((item) => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];
    await updateSharedCartOnServer(updatedCart);
  };

  const removeFromCart = async (productId: string) => {
    const updatedCart = cart.filter((item) => item.productId !== productId);
    await updateSharedCartOnServer(updatedCart);
  };

  const clearCart = async () => {
    await updateSharedCartOnServer([]);
    setCashTendered("");
    setSelectedCategory("all");
    setSearchQuery("");
  };

  const handleTableChange = async (newTable: string) => {
    setTableNumber(newTable);
    await updateSharedCartOnServer(cart, newTable, paymentMethod);
  };

  const handlePaymentMethodChange = async (newPayment: string) => {
    setPaymentMethod(newPayment);
    await updateSharedCartOnServer(cart, tableNumber, newPayment);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cashNum = parseFloat(cashTendered) || 0;
  const changeDue =
    paymentMethod === "cash" ? Math.max(0, cashNum - subtotal) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === "cash" && cashNum < subtotal) {
      alert("Cash tendered is less than the total amount due!");
      return;
    }

    setIsCheckingOut(true);
    const res = await saveIndependentOrder({
      paymentMethod,
      tableNumber,
      totalAmount: subtotal,
      items: cart,
    });

    setIsCheckingOut(false);

    if (res.success) {
      setCompletedOrder({
        orderId: res.orderId,
        queueNumber: res.queueNumber,
        tableNumber,
        total: subtotal,
        paymentMethod,
        cashTendered: paymentMethod === "cash" ? cashNum : subtotal,
        changeDue: paymentMethod === "cash" ? changeDue : 0,
        date: new Date().toLocaleString(),
        items: [...cart],
      });
      await clearCart();
      setIsMobileCartOpen(false);
      loadSessionInfo();
    } else {
      alert("Checkout failed. Could not save order record.");
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

  const handleDeleteOrder = async (orderId: string) => {
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim() !== "") {
      setSelectedCategory("all");
    }
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setSearchQuery("");
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCat =
      selectedCategory === "all" || item.categoryId === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const cartSharedProps = {
    cart,
    clearCart,
    updateQuantity,
    removeFromCart,
    paymentMethod,
    setPaymentMethod: handlePaymentMethodChange,
    tableNumber,
    setTableNumber: handleTableChange,
    cashTendered,
    setCashTendered,
    changeDue,
    subtotal,
    handleCheckout,
    isCheckingOut,
  };

  return (
    <div className="h-screen bg-[#fdfbf7] flex flex-col font-sans overflow-hidden">
      {/* Top POS Navbar */}
      <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-base sm:text-xl font-extrabold text-zinc-950 font-['Montserrat'] flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />{" "}
              Excel-First POS & Sessions
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-500 hidden sm:block">
              Driven by menu.xlsx with session history & queue printing
            </p>
          </div>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />{" "}
            Live Synced
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleFullscreen}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </span>
          </button>
          <button
            onClick={() => setShowSessionModal(true)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" /> Session & Export
          </button>
        </div>
      </header>

      {/* RESPONSIVE LAYOUT CONTAINER */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        {/* SECTION 1: SEARCH & CATEGORY LIST */}
        <div className="lg:col-span-3 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 p-4 sm:p-5 flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto shrink-0 shadow-xs lg:shadow-none">
          <div className="w-full sm:w-64 lg:w-full shrink-0">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 sm:mb-2">
              Search Menu
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Excel items..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs text-zinc-950"
              />
            </div>
          </div>

          <div className="w-auto lg:w-full shrink-0">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 sm:mb-2">
              Categories
            </label>
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              <button
                onClick={() => handleCategorySelect("all")}
                className={`flex items-center justify-between px-3.5 py-2 lg:px-4 lg:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> All Items
                </span>
                <span className="ml-2 text-[10px] opacity-80 bg-black/10 px-2 py-0.5 rounded-full">
                  {products.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = products.filter(
                  (p) => p.categoryId === cat.id,
                ).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center justify-between px-3.5 py-2 lg:px-4 lg:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="ml-2 text-[10px] opacity-80 bg-black/10 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: ITEMS CATALOG GRID */}
        <div
          ref={catalogScrollRef}
          className="lg:col-span-5 xl:col-span-6 p-4 sm:p-6 flex flex-col h-full overflow-y-auto pb-24 lg:pb-6"
        >
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="font-bold text-zinc-950 font-['Montserrat'] text-xs sm:text-sm uppercase tracking-wider">
              Excel Catalog Items ({filteredProducts.length})
            </h2>
            {activeSession && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Active Session Checkouts:{" "}
                <strong>{activeSession.orders?.length || 0}</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-20 text-center text-zinc-400">
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
                <p className="font-medium text-sm">
                  No items found in menu.xlsx
                </p>
                <span className="text-xs">
                  Make sure menu.xlsx has Name, Category, and Price columns.
                </span>
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="group flex flex-col justify-between p-3.5 sm:p-4 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-lg hover:border-emerald-500 transition-all text-left cursor-pointer active:scale-95"
                >
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      {prod.category?.name || "General"}
                    </span>
                    <h3 className="font-bold text-zinc-900 text-xs sm:text-sm mt-1 group-hover:text-emerald-600 transition-colors line-clamp-2">
                      {prod.name}
                    </h3>
                  </div>
                  <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="font-extrabold text-zinc-950 text-sm sm:text-base">
                      ₱{prod.sellingPrice.toFixed(2)}
                    </span>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* SECTION 3: CART & CHECKOUT DESKTOP SIDEBAR */}
        <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 bg-white border-l border-zinc-200 flex-col h-full overflow-hidden">
          <CartContent {...cartSharedProps} />
        </div>
      </div>

      {/* FLOATING MOBILE CART BAR */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 shadow-2xl z-40 flex items-center justify-between animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {totalItemsCount}
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">
                Total Due
              </p>
              <p className="text-base font-extrabold text-emerald-950">
                ₱{subtotal.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-transform cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" /> View Cart & Checkout
            <ChevronUp className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}

      {/* MOBILE CART DRAWER */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            <CartContent
              {...cartSharedProps}
              onCloseMobile={() => setIsMobileCartOpen(false)}
            />
          </div>
        </div>
      )}

      {/* SESSION MANAGEMENT & EXPORT MODAL */}
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
                    {activeSession.orders.map((ord: any, idx: number) => (
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

                        <button
                          onClick={() => handleDeleteOrder(ord.orderId)}
                          className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 cursor-pointer shrink-0"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
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
                Order Successful!
              </h3>
              <div className="flex justify-center gap-2 my-2">
                <div className="py-2 px-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Queue No.
                  </span>
                  <span className="text-2xl font-extrabold text-amber-950">
                    #{completedOrder.queueNumber}
                  </span>
                </div>
                <div className="py-2 px-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Dining Table
                  </span>
                  <span className="text-lg font-extrabold text-emerald-950">
                    {completedOrder.tableNumber}
                  </span>
                </div>
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1 mb-4">
                ✓ Saved to active session
              </p>
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

                <p className="text-[10px] text-zinc-600 mt-1">
                  Order: #{completedOrder.orderId}
                </p>
                <p className="text-[10px] text-zinc-600">
                  {completedOrder.date}
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
                {completedOrder.paymentMethod === "cash" && (
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>₱{completedOrder.changeDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center border-t border-dashed border-zinc-400 pt-2 mt-3 text-[10px]">
                <p>Thank you for your order!</p>
                <p className="font-bold mt-1">
                  Please wait for your queue number.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => printThermalReceipt("thermal-receipt")}
                className="flex-1 py-3 rounded-2xl bg-zinc-800 text-white font-semibold text-sm hover:bg-zinc-900 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                type="button"
                onClick={() => {
                  setCompletedOrder(null);
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors cursor-pointer shadow-md"
              >
                Next Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
