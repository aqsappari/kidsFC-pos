"use client";

import { useState, useEffect, useRef } from "react";
import {
  UtensilsCrossed,
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
  subtotal: number;
  onCloseMobile?: () => void;
}

function CartContent({
  cart,
  clearCart,
  updateQuantity,
  removeFromCart,
  tableNumber,
  subtotal,
  onCloseMobile,
}: CartContentProps) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-zinc-950 font-['Montserrat'] flex items-center gap-2 text-sm sm:text-base">
          <ShoppingCart className="w-5 h-5 text-amber-600" /> Shared Active Cart
        </h2>
        <div className="flex items-center gap-3">
          {cart.length > 0 && (
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
            <span className="text-xs">Synced in real-time with Main POS</span>
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
                  className="w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center cursor-pointer hover:bg-zinc-100"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-xs w-4 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.productId, 1)}
                  className="w-6 h-6 rounded-lg bg-white border border-zinc-200 flex items-center justify-center cursor-pointer hover:bg-zinc-100"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center cursor-pointer ml-1 hover:bg-rose-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-zinc-100 bg-zinc-50 space-y-3 shrink-0">
        <div className="flex justify-between items-center text-sm font-extrabold text-zinc-900">
          <span>Table:</span>
          <span className="text-amber-700">{tableNumber}</span>
        </div>
        <div className="pt-2 border-t border-zinc-200 flex justify-between items-center text-lg font-extrabold">
          <span>Total Due:</span>
          <span className="text-amber-600">₱{subtotal.toFixed(2)}</span>
        </div>
        <div className="w-full py-3 rounded-2xl bg-zinc-200 text-zinc-600 font-bold text-xs text-center uppercase tracking-wider">
          Checkout Restricted to Main POS
        </div>
      </div>
    </div>
  );
}

export default function CashierSecondaryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState("Takeout / Walk-in");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const catalogScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadExcelData();

    // Setup Real-time SSE Connection
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
    setSelectedCategory("all");
    setSearchQuery("");
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
    tableNumber,
    subtotal,
  };

  return (
    <div className="h-screen bg-[#fdfbf7] flex flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-xl font-extrabold text-zinc-950 font-['Montserrat'] flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />{" "}
            Cashier Secondary
          </h1>
          <span className="text-xs bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-full border border-amber-200 hidden sm:flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-600" /> Live
            Synced
          </span>
        </div>

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
      </header>

      {/* Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        {/* SECTION 1: SEARCH & CATEGORY LIST (LEFT SIDEBAR) */}
        <div className="lg:col-span-3 bg-white border-b lg:border-b-0 lg:border-r border-zinc-200 p-4 sm:p-5 flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto shrink-0 shadow-xs lg:shadow-none">
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
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-zinc-950 shadow-xs"
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
                className={`flex items-center justify-between px-3.5 py-2 lg:px-4 lg:py-2.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selectedCategory === "all"
                    ? "bg-amber-600 text-white shadow-xs"
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
                    className={`flex items-center justify-between px-3.5 py-2 lg:px-4 lg:py-2.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? "bg-amber-600 text-white shadow-xs"
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
          className="lg:col-span-6 px-4 sm:px-6 pt-6 flex flex-col h-full overflow-y-auto pb-24 lg:pb-6"
        >
          <h2 className="font-bold text-zinc-950 text-xs sm:text-sm uppercase tracking-wider mb-4 font-['Montserrat']">
            Catalog Items ({filteredProducts.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredProducts.map((prod) => (
              <button
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="group flex flex-col justify-between p-3.5 sm:p-4 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200/80 shadow-xs hover:border-amber-500 hover:shadow-lg transition-all text-left cursor-pointer active:scale-95"
              >
                <div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-wider">
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
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 3: SHARED CART DESKTOP SIDEBAR */}
        <div className="hidden lg:flex lg:col-span-3 bg-white border-l border-zinc-200 flex-col h-full overflow-hidden">
          <CartContent {...cartSharedProps} />
        </div>
      </div>

      {/* FLOATING MOBILE CART BAR */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 p-4 shadow-2xl z-40 flex items-center justify-between animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
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
            className="px-6 py-3 rounded-2xl bg-amber-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-600/20 active:scale-95 transition-transform cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" /> View Cart
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
    </div>
  );
}
