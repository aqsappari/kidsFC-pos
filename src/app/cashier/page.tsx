"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
  X,
  ChevronUp,
} from "lucide-react";
import { getPOSData, processPOSOrder } from "./actions";
import { printThermalReceipt } from "@/utils/printReceipt";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  categoryId: string | null;
  category?: Category | null;
  recipeItems: any[];
}

interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

// 1. Extracted outside to prevent React from unmounting inputs on parent re-renders
interface CartContentProps {
  cart: CartItem[];
  clearCart: () => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  paymentMethod: string;
  setPaymentMethod: (m: string) => void;
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
      {/* Cart Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-zinc-900 font-['Montserrat'] flex items-center gap-2 text-sm sm:text-base">
          <ShoppingCart className="w-5 h-5 text-brand" /> Current Order
        </h2>
        <div className="flex items-center gap-3">
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-danger hover:underline cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="text-center py-16 text-zinc-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
            <p className="text-sm font-medium">Cart is empty</p>
            <span className="text-xs">
              Click any menu item to start an order.
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
                  className="w-6 h-6 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 cursor-pointer ml-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Footer / Checkout Controls */}
      <div className="p-4 border-t border-zinc-100 bg-zinc-50 space-y-3 shrink-0">
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
                    ? "bg-brand text-white shadow-xs"
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
                className="w-full px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                Change Due
              </label>
              <div className="px-3 py-1.5 rounded-xl bg-zinc-200/70 border border-zinc-200 text-xs font-extrabold text-brand-dark flex items-center">
                ₱{changeDue.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-zinc-200/60 flex justify-between items-center text-lg font-extrabold text-zinc-900">
          <span className="text-sm">Total Due:</span>
          <span className="text-brand">₱{subtotal.toFixed(2)}</span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || isCheckingOut}
          className="w-full py-3 rounded-2xl bg-brand text-white font-bold text-sm hover:bg-brand-dark transition-all shadow-lg shadow-brand/20 cursor-pointer disabled:opacity-50"
        >
          {isCheckingOut
            ? "Processing..."
            : `Complete Order (₱{subtotal.toFixed(2)})`}
        </button>
      </div>
    </div>
  );
}

export default function CashierPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashTendered, setCashTendered] = useState<string>("");

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Mobile drawer state for cart view on smaller screens
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Reference for the items catalog container to reset scroll position
  const catalogScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const data = await getPOSData();
    setCategories(data.categories);
    setProducts(data.products);
  }

  // Automatically scroll back to top of catalog when filter or search changes
  useEffect(() => {
    if (catalogScrollRef.current) {
      catalogScrollRef.current.scrollTop = 0;
    }
  }, [selectedCategory, searchQuery]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.sellingPrice,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      (prev) =>
        prev
          .map((item) => {
            if (item.productId === productId) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[],
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashTendered("");
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
    const res = await processPOSOrder({
      paymentMethod,
      totalAmount: subtotal,
      items: cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    });

    setIsCheckingOut(false);

    if (res.success) {
      setCompletedOrder({
        orderId: res.orderId,
        total: subtotal,
        paymentMethod,
        cashTendered: paymentMethod === "cash" ? cashNum : subtotal,
        changeDue: paymentMethod === "cash" ? changeDue : 0,
        date: new Date().toLocaleString(),
        items: [...cart],
      });
      clearCart();
      setIsMobileCartOpen(false);
    } else {
      alert("Checkout failed. Please check inventory stock levels.");
    }
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
    setPaymentMethod,
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
          <Link
            href="/"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition-colors"
            title="Exit POS"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div>
            <h1 className="text-base sm:text-xl font-extrabold text-brand-dark font-['Montserrat'] flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-brand" />{" "}
              Cashier POS
            </h1>
            <p className="text-[10px] sm:text-xs text-zinc-500 hidden sm:block">
              Recipe-based automated inventory deduction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary-dark font-semibold text-xs transition-colors"
          >
            Admin Panel
          </Link>
        </div>
      </header>

      {/* RESPONSIVE LAYOUT CONTAINER */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        {/* SECTION 1: SEARCH & CATEGORY LIST (Collapsible / Top filters on mobile, Sidebar on desktop) */}
        <div className="lg:col-span-3 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 p-4 sm:p-5 flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto shrink-0 shadow-xs lg:shadow-none">
          {/* Search Bar */}
          <div className="w-full sm:w-64 lg:w-full shrink-0">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 sm:mb-2">
              Search Menu
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand shadow-xs"
              />
            </div>
          </div>

          {/* Categories Horizontal Scroll on Mobile, Vertical Stack on Desktop */}
          <div className="w-auto lg:w-full shrink-0">
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 sm:mb-2">
              Categories
            </label>
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex items-center justify-between px-3.5 py-2 lg:px-4 lg:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-brand text-white shadow-xs"
                    : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5 lg:w-4 lg:w-4" /> All Items
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
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center justify-between px-3.5 py-2 lg:px-4 lg:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? "bg-brand text-white shadow-xs"
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

        {/* SECTION 2: ITEMS CATALOG GRID (Middle - Scrollable) */}
        <div
          ref={catalogScrollRef}
          className="lg:col-span-5 xl:col-span-6 p-4 sm:p-6 flex flex-col h-full overflow-y-auto pb-24 lg:pb-6"
        >
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="font-bold text-zinc-900 font-['Montserrat'] text-xs sm:text-sm uppercase tracking-wider">
              Menu Items ({filteredProducts.length})
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-20 text-center text-zinc-400">
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
                <p className="font-medium text-sm">No available items found.</p>
                <span className="text-xs">
                  Try searching another term or check category filters.
                </span>
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="group flex flex-col justify-between p-3.5 sm:p-4 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-lg hover:border-brand transition-all text-left cursor-pointer active:scale-95"
                >
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-secondary uppercase tracking-wider">
                      {prod.category?.name || "General"}
                    </span>
                    <h3 className="font-bold text-zinc-900 text-xs sm:text-sm mt-1 group-hover:text-brand transition-colors line-clamp-2">
                      {prod.name}
                    </h3>
                  </div>
                  <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="font-extrabold text-brand-dark text-sm sm:text-base">
                      ₱{prod.sellingPrice.toFixed(2)}
                    </span>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-brand/10 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* SECTION 3: CART & CHECKOUT (Desktop Sidebar) */}
        <div className="hidden lg:flex lg:col-span-4 xl:col-span-3 bg-white border-l border-zinc-200 flex-col h-full overflow-hidden">
          <CartContent {...cartSharedProps} />
        </div>
      </div>

      {/* FLOATING MOBILE CART BAR */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 shadow-2xl z-40 flex items-center justify-between animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand text-white flex items-center justify-center font-bold text-sm shadow-md">
              {totalItemsCount}
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">
                Total Due
              </p>
              <p className="text-base font-extrabold text-brand-dark">
                ₱{subtotal.toFixed(2)}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="px-6 py-3 rounded-2xl bg-brand text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-brand/20 active:scale-95 transition-transform"
          >
            <ShoppingCart className="w-4 h-4" /> View Cart & Checkout
            <ChevronUp className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}

      {/* MOBILE CART & CHECKOUT MODAL DRAWER */}
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

      {/* SUCCESS MODAL & THERMAL RECEIPT */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center border border-zinc-100">
            <div>
              <div className="w-12 h-12 rounded-full bg-success/15 text-success flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 font-['Montserrat']">
                Order Successful!
              </h3>
              <p className="text-xs text-success font-medium mt-1 mb-4">
                ✓ Inventory stock deducted
              </p>
            </div>

            {/* Printable 58mm Receipt Area */}
            <div
              id="thermal-receipt"
              className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 mb-5 text-left font-mono text-xs text-zinc-900"
            >
              <div className="text-center border-b border-dashed border-zinc-400 pb-2 mb-2">
                <p className="font-bold text-sm uppercase">KIDS FOOD & CAFE</p>
                <p className="text-[10px] text-zinc-600">
                  Official Order Receipt
                </p>
                <p className="text-[10px] text-zinc-600 mt-1">
                  Order: #{completedOrder.orderId}
                </p>
                <p className="text-[10px] text-zinc-600">
                  {completedOrder.date}
                </p>
              </div>

              <div className="space-y-1.5 border-b border-dashed border-zinc-400 pb-2 mb-2">
                {completedOrder.items.map((it: any, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between items-start gap-2"
                  >
                    <span className="flex-1">
                      {it.quantity}x {it.name}
                    </span>
                    <span className="shrink-0">
                      ₱{(it.unitPrice * it.quantity).toFixed(2)}
                    </span>
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
                <p>Please come again.</p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => printThermalReceipt("thermal-receipt")}
                className="flex-1 py-3 rounded-2xl bg-secondary text-white font-semibold text-sm hover:bg-secondary-dark transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-secondary/20"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="flex-1 py-3 rounded-2xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-colors cursor-pointer shadow-md shadow-brand/20"
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
