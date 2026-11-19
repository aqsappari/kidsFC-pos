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
  Layers,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getIndependentMenuData,
  type GroupedProduct,
  type ProductVariant,
} from "../cashier-xlsx/actions";

interface Category {
  id: string;
  name: string;
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
  isTableLocked: boolean;
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
  isTableLocked,
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
                <h4 className="font-bold text-zinc-900 text-xs line-clamp-2">
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
            disabled={isReadyForCheckout || isTableLocked}
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold text-zinc-950 disabled:opacity-60"
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
  const tokenParam = searchParams.get("token");

  const terminalId = uParam || "table-1";
  const isWaiterTerminal = terminalId.toLowerCase().startsWith("waiter");
  const isFixedTableTerminal = terminalId.toLowerCase().startsWith("table-");

  const fixedTableLabel = isFixedTableTerminal
    ? `Table ${terminalId.split("-")[1]}`
    : null;

  const displayHeaderTitle = isWaiterTerminal
    ? "Server / Waiter Terminal"
    : fixedTableLabel
      ? `${fixedTableLabel} Ordering`
      : `Terminal: ${terminalId}`;

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<GroupedProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState(
    fixedTableLabel || "Takeout / Walk-in",
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isReadyForCheckout, setIsReadyForCheckout] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [currentMenuPage, setCurrentMenuPage] = useState<number>(0);
  const menuPages = [
    {
      title: "Page 1: Food & Snacks",
      src: "/Foods.jfif",
    },
    {
      title: "Page 2: Beverages",
      src: "/Drinks.jfif",
    },
    {
      title: "Page 3: Free WIFI",
      src: "/free-wifi.png",
    },
  ];

  // Variant Modal State
  const [variantModalProduct, setVariantModalProduct] =
    useState<GroupedProduct | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);

  const catalogScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function verifyAccessAndLoad() {
      try {
        const res = await fetch("/api/cart-sync");
        const data = await res.json();

        if (data[terminalId]) {
          const expectedToken = data[terminalId].secretToken;
          if (expectedToken && tokenParam !== expectedToken) {
            setIsAuthorized(false);
            setAuthError(
              "Invalid or missing security token for this terminal.",
            );
            return;
          }
        }
        setIsAuthorized(true);
      } catch (err) {
        setIsAuthorized(true);
      }

      loadExcelData();
    }

    verifyAccessAndLoad();

    const eventSource = new EventSource("/api/cart-sync?type=stream");
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const tData = data[terminalId];
        if (tData) {
          setCart(tData.cart || []);
          setTableNumber(
            fixedTableLabel || tData.tableNumber || "Takeout / Walk-in",
          );
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
  }, [terminalId, tokenParam, fixedTableLabel]);

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
    const finalTable = fixedTableLabel || newTable;
    setCart(newCart);
    setTableNumber(finalTable);

    await fetch("/api/cart-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        terminalId,
        token: tokenParam,
        cart: newCart,
        tableNumber: finalTable,
        paymentMethod: newPayment,
        isReadyForCheckout: newReadyState,
      }),
    });
  };

  const handleProductClick = async (product: GroupedProduct) => {
    if (isReadyForCheckout) return;

    const hasMultipleVariants = product.variants && product.variants.length > 1;
    const hasCustomSingleVariant =
      product.variants &&
      product.variants.length === 1 &&
      product.variants[0].name.toLowerCase() !== "standard";

    if (hasMultipleVariants || hasCustomSingleVariant) {
      setModalQty(1);
      setVariantModalProduct(product);
      return;
    }

    const defaultVariant = product.variants?.[0] || {
      id: product.id,
      name: "Standard",
      price: product.sellingPrice,
    };
    await addVariantToCart(product, defaultVariant, 1);
  };

  const addVariantToCart = async (
    product: GroupedProduct,
    variant: ProductVariant,
    quantityToAdd: number,
  ) => {
    if (isReadyForCheckout) return;

    const isStandard = variant.name.toLowerCase() === "standard";
    const displayName = isStandard
      ? product.name
      : `${product.name} (${variant.name})`;

    let updatedCart = [...cart];
    const existing = updatedCart.find((item) => item.productId === variant.id);

    if (existing) {
      updatedCart = updatedCart.map((item) =>
        item.productId === variant.id
          ? { ...item, quantity: item.quantity + quantityToAdd }
          : item,
      );
    } else {
      updatedCart.push({
        productId: variant.id,
        name: displayName,
        unitPrice: variant.price,
        quantity: quantityToAdd,
      });
    }

    await updateSharedCartOnServer(updatedCart);
    setVariantModalProduct(null);
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

  if (isAuthorized === false) {
    return (
      <div className="h-screen bg-[#fdfbf7] flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm text-center border border-rose-100 space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            🚫
          </div>
          <h2 className="text-xl font-bold text-zinc-950 font-['Montserrat']">
            Access Denied
          </h2>
          <p className="text-xs text-zinc-600 leading-relaxed">
            {authError ||
              "Invalid security token. Please scan the official table QR code."}
          </p>
        </div>
      </div>
    );
  }

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
    isTableLocked: isFixedTableTerminal,
  };

  return (
    <div className="h-screen bg-[#fdfbf7] flex flex-col font-sans overflow-hidden">
      <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between shadow-xs shrink-0 z-20">
        <div className="flex items-center gap-3">
          <h1 className="text-lg sm:text-xl font-extrabold text-zinc-950 font-['Montserrat'] flex items-center gap-2">
            <FileSpreadsheet
              className={`w-5 h-5 ${isWaiterTerminal ? "text-indigo-600" : "text-amber-600"}`}
            />
            {displayHeaderTitle}
          </h1>
          <span className="text-xs bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-full border border-amber-200 hidden sm:flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-600" /> Live
            Synced
          </span>
          {isReadyForCheckout && (
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
              ✓ Ready Flagged
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
          <span className="hidden sm:inline">
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </span>
        </button>
      </header>

      {/* Persistent Layout: Always visible left category sidebar (col-span-3), center catalog (col-span-6), and right cart (col-span-3) */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden relative">
        {/* LEFT SIDEBAR: CATEGORIES & SEARCH (Always Visible) */}
        <div className="col-span-3 bg-white border-r border-zinc-200 p-3 sm:p-5 flex flex-col justify-between shrink-0 shadow-xs overflow-y-auto">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Search Menu
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={isReadyForCheckout}
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Categories
              </label>
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                <button
                  disabled={isReadyForCheckout}
                  onClick={() => setSelectedCategory("all")}
                  className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all ${
                    selectedCategory === "all"
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                  } disabled:opacity-50`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <LayoutGrid className="w-4 h-4 shrink-0" />{" "}
                    <span className="truncate">All Items</span>
                  </span>
                  <span className="text-[10px] opacity-80 bg-black/10 px-2 py-0.5 rounded-full shrink-0">
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
                      className={`flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold cursor-pointer transition-all ${
                        selectedCategory === cat.id
                          ? "bg-amber-600 text-white shadow-sm"
                          : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                      } disabled:opacity-50`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] opacity-80 bg-black/10 px-2 py-0.5 rounded-full shrink-0">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* View Menu Button at the Bottom of Category Container */}
          <div className="pt-4 border-t border-zinc-100 shrink-0">
            <button
              onClick={() => setIsMenuModalOpen(true)}
              className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Menu</span>
            </button>
          </div>
        </div>

        {/* CENTER: CATALOG GRID */}
        <div
          ref={catalogScrollRef}
          className="col-span-9 px-4 sm:px-6 pt-6 flex flex-col h-full overflow-y-auto pb-24 lg:pb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-950 text-xs sm:text-sm uppercase tracking-wider font-['Montserrat']">
              Catalog Items ({filteredProducts.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredProducts.map((prod) => {
              const hasVariants = prod.variants && prod.variants.length > 1;
              const minPrice = prod.sellingPrice;
              const maxPrice = hasVariants
                ? Math.max(...prod.variants.map((v) => v.price))
                : minPrice;
              const hasPriceRange = hasVariants && maxPrice > minPrice;

              return (
                <button
                  key={prod.id}
                  disabled={isReadyForCheckout}
                  onClick={() => handleProductClick(prod)}
                  className="group flex flex-col justify-between p-3.5 sm:p-4 bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-xs hover:border-amber-500 transition-all text-left cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 uppercase truncate">
                        {prod.category?.name}
                      </span>
                      {hasVariants && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase shrink-0">
                          <Layers className="w-2.5 h-2.5" />{" "}
                          {prod.variants.length} Options
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-zinc-900 text-xs sm:text-sm mt-1 group-hover:text-amber-600 line-clamp-2">
                      {prod.name}
                    </h3>
                  </div>
                  <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="font-extrabold text-zinc-950 text-xs sm:text-base">
                      {hasPriceRange
                        ? `₱${minPrice.toFixed(0)}–₱${maxPrice.toFixed(0)}`
                        : `₱${minPrice.toFixed(2)}`}
                    </span>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white">
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDEBAR: DESKTOP CART */}
        <div className="hidden lg:flex col-span-3 bg-white border-l border-zinc-200 flex-col h-full overflow-hidden">
          <CartContent {...cartSharedProps} />
        </div>
      </div>

      {/* MENU IMAGE POPUP MODAL */}
      {isMenuModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setIsMenuModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-zinc-50">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-zinc-950 text-base font-['Montserrat']">
                  {menuPages[currentMenuPage].title}
                </h3>
              </div>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Image Viewer */}
            <div className="relative flex-1 bg-zinc-950 flex items-center justify-center overflow-auto p-4 min-h-[450px]">
              <img
                src={menuPages[currentMenuPage].src}
                alt="Menu Page"
                className="max-h-[68vh] w-auto object-contain rounded-xl shadow-lg"
              />

              {/* Prev / Next Page Buttons */}
              <button
                onClick={() =>
                  setCurrentMenuPage((prev) =>
                    prev === 0 ? menuPages.length - 1 : prev - 1,
                  )
                }
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-zinc-900 flex items-center justify-center shadow-lg cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() =>
                  setCurrentMenuPage((prev) => (prev + 1) % menuPages.length)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-zinc-900 flex items-center justify-center shadow-lg cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Footer / Page Switcher Tabs */}
            <div className="p-4 bg-white border-t border-zinc-100 flex items-center justify-center gap-3 shrink-0">
              {menuPages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMenuPage(index)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold cursor-pointer transition-all ${
                    currentMenuPage === index
                      ? "bg-amber-600 text-white shadow-md"
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                  }`}
                >
                  Page {index + 1}:{" "}
                  {index === 0
                    ? "Food & Snacks"
                    : index === 2
                      ? "Free WIFI"
                      : "Beverages"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VARIANT SELECTION MODAL */}
      {variantModalProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setVariantModalProduct(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-zinc-100 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {variantModalProduct.category?.name}
                </span>
                <h3 className="text-xl font-extrabold text-zinc-950 font-['Montserrat'] mt-2">
                  {variantModalProduct.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Choose a variant option
                </p>
              </div>
              <button
                onClick={() => setVariantModalProduct(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200/80">
              <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Quantity
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-xl bg-white border border-zinc-200 text-zinc-800 flex items-center justify-center hover:bg-zinc-100 cursor-pointer shadow-xs"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-extrabold text-base w-6 text-center text-zinc-950">
                  {modalQty}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQty((q) => q + 1)}
                  className="w-8 h-8 rounded-xl bg-white border border-zinc-200 text-zinc-800 flex items-center justify-center hover:bg-zinc-100 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Select Variant
              </label>
              {variantModalProduct.variants.map((variant) => {
                const lineTotal = variant.price * modalQty;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() =>
                      addVariantToCart(variantModalProduct, variant, modalQty)
                    }
                    className="w-full p-4 rounded-2xl bg-white hover:bg-amber-50 border-2 border-zinc-200 hover:border-amber-500 transition-all flex items-center justify-between text-left cursor-pointer group active:scale-[0.99]"
                  >
                    <div>
                      <span className="font-extrabold text-sm text-zinc-900 group-hover:text-amber-800 block">
                        {variant.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        ₱{variant.price.toFixed(2)} each
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-amber-700 bg-amber-100/80 px-3 py-1.5 rounded-xl">
                        + ₱{lineTotal.toFixed(2)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
