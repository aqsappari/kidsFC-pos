"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet, Radio, BookOpen, ShieldAlert, X } from "lucide-react";
import {
  getIndependentMenuData,
  type GroupedProduct,
  type ProductVariant,
} from "../cashier-actions";

import { CartItem, CartContent } from "./components/CartContent";
import { CategorySidebar } from "./components/CategorySidebar";
import { CatalogGrid } from "./components/CatalogGrid";
import { MenuModal } from "./components/MenuModal";
import { VariantModal } from "./components/VariantModal";
import { MobileCartBar } from "./components/MobileCartBar";

interface Category {
  id: string;
  name: string;
}

function CashierSecondaryContent() {
  const searchParams = useSearchParams();
  const uParam = searchParams.get("u");
  const tokenParam = searchParams.get("token");

  const terminalId = uParam || "table-1";
  const isWaiterTerminal = terminalId.toLowerCase().startsWith("waiter");
  const isEmergencyTerminal = terminalId.toLowerCase().includes("emergency");

  const displayHeaderTitle = isEmergencyTerminal
    ? "🚨 Emergency Order Edit Terminal"
    : isWaiterTerminal
      ? "Server / Waiter Terminal"
      : `Terminal: ${terminalId}`;

  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<GroupedProduct[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isReadyForCheckout, setIsReadyForCheckout] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | undefined>();

  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [currentMenuPage, setCurrentMenuPage] = useState<number>(0);

  const menuPages = [
    { title: "Page 1: Food & Snacks", src: "/Foods.jfif", isQr: false },
    { title: "Page 2: Beverages", src: "/Drinks.jfif", isQr: false },
    { title: "Page 3: Free WIFI", src: "", isQr: true },
  ];

  const wifiSsid = process.env.NEXT_PUBLIC_WIFI_SSID || "FREE WIFI V2";
  const wifiPassword = process.env.NEXT_PUBLIC_WIFI_PASSWORD || "fw@21436587";
  const wifiEncryption = process.env.NEXT_PUBLIC_WIFI_ENCRYPTION || "WPA";
  const wifiString = `WIFI:S:${wifiSsid};T:${wifiEncryption};P:${wifiPassword};;`;

  const [variantModalProduct, setVariantModalProduct] =
    useState<GroupedProduct | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);

  const catalogScrollRef = useRef<HTMLDivElement>(null);
  const prevCartLengthRef = useRef(cart.length);

  useEffect(() => {
    if (prevCartLengthRef.current > 0 && cart.length === 0) {
      setSelectedCategory("all");
      setIsMobileCartOpen(false);
      setTableNumber("");
    }
    prevCartLengthRef.current = cart.length;
  }, [cart.length]);

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
          const newCart = tData.cart || [];
          setCart(newCart);
          setEditingOrderId(tData.editingOrderId);

          if (newCart.length === 0) {
            setSelectedCategory("all");
            setIsMobileCartOpen(false);
            setTableNumber("");
          } else {
            setTableNumber((prevTable) => {
              if (
                !prevTable &&
                tData.tableNumber &&
                tData.tableNumber !== "Takeout / Walk-in"
              ) {
                return tData.tableNumber;
              }
              return prevTable || tData.tableNumber || "";
            });
          }

          setPaymentMethod(tData.paymentMethod || "cash");
          setIsReadyForCheckout(!!tData.isReadyForCheckout);
        }
      } catch (err) {
        console.error("Failed to parse SSE cart update:", err);
      }
    };

    return () => eventSource.close();
  }, [terminalId, tokenParam]);

  async function loadExcelData() {
    const data = await getIndependentMenuData();
    setCategories(data.categories);
    setProducts(data.products);
  }

  const updateSharedCartOnServer = async (
    newCart: CartItem[],
    newTable = tableNumber,
    newPayment = paymentMethod,
    newReadyState = isReadyForCheckout,
  ) => {
    setCart(newCart);
    setTableNumber(newTable);

    await fetch("/api/cart-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        terminalId,
        token: tokenParam,
        cart: newCart,
        tableNumber: newTable,
        paymentMethod: newPayment,
        cashTendered: 0,
        isReadyForCheckout: newReadyState,
        editingOrderId,
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

    const price = variant.price;

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
        unitPrice: price,
        originalPrice: price,
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
    if (!tableNumber) {
      alert(
        "Please select whether the order is Dine-in or Takeout before flagging ready.",
      );
      return;
    }

    const nextState = !isReadyForCheckout;
    setIsReadyForCheckout(nextState);
    await updateSharedCartOnServer(cart, tableNumber, paymentMethod, nextState);
  };

  if (isAuthorized === false) {
    return (
      <div className="h-screen bg-[#fdfbf7] flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm text-center border border-rose-100 space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
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
    const matchesCat =
      selectedCategory === "all" || item.categoryId === selectedCategory;
    return matchesCat;
  });

  const productCountsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    });
    return counts;
  }, [products]);

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
    editingOrderId,
  };

  return (
    <div className="h-screen bg-[#fdfbf7] flex flex-col font-sans overflow-hidden">
      <header
        className={`border-b px-6 py-4 flex items-center justify-between shadow-xs shrink-0 z-20 ${
          isEmergencyTerminal
            ? "bg-rose-50 border-rose-200"
            : "bg-white border-zinc-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <h1
            className={`text-lg sm:text-xl font-extrabold font-['Montserrat'] flex items-center gap-2 ${
              isEmergencyTerminal ? "text-rose-900" : "text-zinc-950"
            }`}
          >
            <FileSpreadsheet
              className={`w-5 h-5 ${
                isEmergencyTerminal
                  ? "text-rose-600"
                  : isWaiterTerminal
                    ? "text-indigo-600"
                    : "text-amber-600"
              }`}
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
          onClick={() => setIsMenuModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>View Menu</span>
        </button>
      </header>

      <div className="flex-1 grid grid-cols-12 overflow-hidden relative">
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(catId) => setSelectedCategory(catId)}
          totalProductsCount={products.length}
          productCountsByCategory={productCountsByCategory}
          isReadyForCheckout={isReadyForCheckout}
        />

        <CatalogGrid
          products={filteredProducts}
          isReadyForCheckout={isReadyForCheckout}
          onProductClick={handleProductClick}
          catalogScrollRef={catalogScrollRef}
        />

        <div className="hidden lg:flex col-span-3 bg-white border-l border-zinc-200 flex-col h-full overflow-hidden">
          <CartContent {...cartSharedProps} />
        </div>
      </div>

      <MenuModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        currentMenuPage={currentMenuPage}
        setCurrentMenuPage={setCurrentMenuPage}
        menuPages={menuPages}
        wifiString={wifiString}
        wifiSsid={wifiSsid}
        wifiPassword={wifiPassword}
      />

      <VariantModal
        variantModalProduct={variantModalProduct}
        onClose={() => setVariantModalProduct(null)}
        modalQty={modalQty}
        setModalQty={setModalQty}
        onAddVariant={addVariantToCart}
      />

      <MobileCartBar
        totalItemsCount={totalItemsCount}
        subtotal={subtotal}
        onOpenMobileCart={() => setIsMobileCartOpen(true)}
      />

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
