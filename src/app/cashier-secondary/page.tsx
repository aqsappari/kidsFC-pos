"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  LayoutGrid,
  FileSpreadsheet,
  Radio,
  Maximize,
  Minimize,
  ChevronUp,
  X,
  CheckCircle2,
} from "lucide-react";
import { getIndependentMenuData } from "../cashier-xlsx/actions";

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
  tableNumber: string;
  setTableNumber: (t: string) => void;
  paymentMethod: string;
  setPaymentMethod: (p: string) => void;
  subtotal: number;
  isReadyForCheckout: boolean;
  toggleReadyForCheckout: () => void;
  onCloseMobile?: () => void;
}

function CartContent({
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
  onCloseMobile,
}: CartContentProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-zinc-950 font-['Montserrat'] flex items-center gap-2 text-sm sm:text-base">
          <ShoppingCart className="w-5 h-5 text-amber-600" /> Active Order Cart
        </h2>
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
                  disabled={isReadyForCheckout}
                  onClick={() => updateQuantity(item.productId, 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center cursor-pointer hover:bg-zinc-100 disabled:opacity-50"
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
          ))
        )}
      </div>

      <div className="p-4 border-t border-zinc-100 bg-zinc-50 space-y-3 shrink-0">
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
            Table / Order Type
          </label>
          <select
            disabled={isReadyForCheckout}
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-950 disabled:opacity-50"
          >
            <option value="Takeout / Walk-in">Takeout / Walk-in</option>
            {Array.from({ length: 10 }, (_, i) => (
              <option key={i + 1} value={`Table ${i + 1}`}>
                Table {i + 1}
              </option>
            ))}
          </select>
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
          <span>Total Due:</span>
          <span className="text-amber-600">₱{subtotal.toFixed(2)}</span>
        </div>

        <button
          onClick={toggleReadyForCheckout}
          disabled={cart.length === 0}
          className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md ${
            isReadyForCheckout
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
              : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
          } disabled:opacity-50`}
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

function CashierSecondaryContent() {
  const searchParams = useSearchParams();
  const uParam = searchParams.get("u");
  const terminalId = Math.min(
    10,
    Math.max(1, parseInt(uParam || "1", 10) || 1),
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState("Takeout / Walk-in");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isReadyForCheckout, setIsReadyForCheckout] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const catalogScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadExcelData();

    const eventSource = new EventSource("/api/cart-sync?type=stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const tData = data[terminalId];
        if (tData) {
          setCart(tData.cart || []);
          setTableNumber(tData.tableNumber || "Takeout / Walk-in");
          setPaymentMethod(tData.paymentMethod || "cash");
          setIsReadyForCheckout(!!tData.isReadyForCheckout);
        }
      } catch (err) {
        console.error("Failed to parse SSE cart update:", err);
      }
    };

    const handleFullscreenChange = () =>
      setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      eventSource.close();
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [terminalId]);

  async function loadExcelData() {
    const data = await getIndependentMenuData();
    setCategories(data.categories);
    setProducts(data.products);
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  const updateSharedCartOnServer = async (
    newCart: CartItem[],
    newTable = tableNumber,
    newPayment = paymentMethod,
    newReadyState = isReadyForCheckout,
  ) => {
    setCart(newCart);
    await fetch("/api/cart-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        terminalId,
        cart: newCart,
        tableNumber: newTable,
        paymentMethod: newPayment,
        isReadyForCheckout: newReadyState,
      }),
    });
  };

  const addToCart = async (product: Product) => {
    if (isReadyForCheckout) return;
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
    if (isReadyForCheckout) return;
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
    if (isReadyForCheckout) return;
    const updatedCart = cart.filter((item) => item.productId !== productId);
    await updateSharedCartOnServer(updatedCart);
  };

  const clearCart = async () => {
    if (isReadyForCheckout) return;
    await updateSharedCartOnServer([]);
  };

  const toggleReadyForCheckout = async () => {
    const nextState = !isReadyForCheckout;
    setIsReadyForCheckout(nextState);
    await updateSharedCartOnServer(cart, tableNumber, paymentMethod, nextState);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
    tableNumber,
    setTableNumber: (t: string) =>
      updateSharedCartOnServer(cart, t, paymentMethod, isReadyForCheckout),
    paymentMethod,
    setPaymentMethod: (p: string) =>
      updateSharedCartOnServer(cart, tableNumber, p, isReadyForCheckout),
    subtotal,
    isReadyForCheckout,
    toggleReadyForCheckout,
  };

  return (
    <div className="h-screen bg-[#fdfbf7] flex flex-col font-sans overflow-hidden">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold text-zinc-950 font-['Montserrat'] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-600" /> Cashier
            Secondary (Terminal #{terminalId})
          </h1>
          <span className="text-xs bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-full border border-amber-200 hidden sm:flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-600" /> Live
            Synced
          </span>
          {isReadyForCheckout && (
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
              ✓ Flagged Ready
            </span>
          )}
        </div>

        <button
          onClick={toggleFullscreen}
          className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4" />
          ) : (
            <Maximize className="w-4 h-4" />
          )}
          <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        {/* LEFT SIDEBAR WITH lg:items-start TO PREVENT VERTICAL STRETCHING */}
        <div className="lg:col-span-3 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 p-4 sm:p-5 flex flex-row lg:flex-col lg:items-start gap-4 overflow-x-auto lg:overflow-y-auto shrink-0 shadow-xs lg:shadow-none">
          <div className="w-full sm:w-64 lg:w-full shrink-0">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Search Menu
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                disabled={isReadyForCheckout}
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="w-auto lg:w-full shrink-0">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Categories
            </label>
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              <button
                disabled={isReadyForCheckout}
                onClick={() => setSelectedCategory("all")}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-amber-600 text-white"
                    : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                } disabled:opacity-50`}
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" /> All Items
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
                    disabled={isReadyForCheckout}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? "bg-amber-600 text-white"
                        : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                    } disabled:opacity-50`}
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

        {/* CENTER: CATALOG GRID */}
        <div
          ref={catalogScrollRef}
          className="lg:col-span-6 px-4 sm:px-6 pt-6 flex flex-col h-full overflow-y-auto pb-24 lg:pb-6"
        >
          <h2 className="font-bold text-zinc-950 text-sm uppercase tracking-wider mb-4 font-['Montserrat']">
            Catalog Items ({filteredProducts.length}){" "}
            {isReadyForCheckout && (
              <span className="text-emerald-600 text-xs">
                (Locked - Ready for Checkout)
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredProducts.map((prod) => (
              <button
                key={prod.id}
                disabled={isReadyForCheckout}
                onClick={() => addToCart(prod)}
                className="group flex flex-col justify-between p-3.5 sm:p-4 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-xs hover:border-amber-500 transition-all text-left cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase">
                    {prod.category?.name}
                  </span>
                  <h3 className="font-bold text-zinc-900 text-xs sm:text-sm mt-1 group-hover:text-amber-600 line-clamp-2">
                    {prod.name}
                  </h3>
                </div>
                <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="font-extrabold text-zinc-950 text-sm sm:text-base">
                    ₱{prod.sellingPrice.toFixed(2)}
                  </span>
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT SIDEBAR: DESKTOP CART */}
        <div className="hidden lg:flex lg:col-span-3 bg-white border-l border-zinc-200 flex-col h-full overflow-hidden">
          <CartContent {...cartSharedProps} />
        </div>
      </div>

      {/* FLOATING FOOTER FOR SMALLER SCREENS */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 shadow-2xl z-40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
              {totalItemsCount}
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">
                Total Due
              </p>
              <p className="text-base font-extrabold text-amber-950">
                ₱{subtotal.toFixed(2)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="px-6 py-3 rounded-2xl bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" /> View Cart{" "}
            <ChevronUp className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}

      {/* MOBILE CART DRAWER */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <CartContent
              {...cartSharedProps}
              onCloseMobile={() => setIsMobileCartOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function CashierSecondaryPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center font-bold text-zinc-500">
          Loading Terminal...
        </div>
      }
    >
      <CashierSecondaryContent />
    </Suspense>
  );
}
