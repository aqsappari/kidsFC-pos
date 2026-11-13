"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LayoutDashboard,
  PackagePlus,
  ChefHat,
  Boxes,
  UtensilsCrossed,
  Receipt,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ShoppingBag,
  ShieldAlert,
} from "lucide-react";
import { getAdminDashboardMetrics } from "./actions";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    setIsLoading(true);
    const data = await getAdminDashboardMetrics();
    setMetrics(data);
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center font-sans">
        <p className="text-zinc-500 font-medium">Loading admin dashboard...</p>
      </div>
    );
  }

  const {
    todaySales,
    todayOrdersCount,
    totalProductsCount,
    totalIngredientsCount,
    lowStockCount,
    lowStockItems,
  } = metrics;

  const adminModules = [
    {
      title: "Stock-In Purchases",
      desc: "Log deliveries (sacks, packs) & update base inventory",
      href: "/admin/purchases",
      icon: PackagePlus,
      color: "bg-brand/10 text-brand",
    },
    {
      title: "Recipe & Costing BOM",
      desc: "Map ingredients & packaging to menu items",
      href: "/admin/recipes",
      icon: ChefHat,
      color: "bg-secondary/10 text-secondary-dark",
    },
    {
      title: "Ingredient Inventory",
      desc: "Monitor raw stock levels, costs, and waste logs",
      href: "/admin/inventory",
      icon: Boxes,
      color: "bg-success/10 text-success",
    },
    {
      title: "Menu Products",
      desc: "Manage dishes, selling prices, & POS availability",
      href: "/admin/products",
      icon: UtensilsCrossed,
      color: "bg-info/10 text-info",
    },
    {
      title: "Expenses & Consumables",
      desc: "Track utilities, rent, and packaging overheads",
      href: "/admin/expenses",
      icon: Receipt,
      color: "bg-warning/10 text-warning-dark",
    },
    {
      title: "Financial Reports",
      desc: "Analyze revenue, food costs, and net profit margins",
      href: "/admin/reports",
      icon: TrendingUp,
      color: "bg-brand/10 text-brand-dark",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs"
            title="Return to Gate Screen"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark font-['Montserrat'] flex items-center gap-2">
              <LayoutDashboard className="w-7 h-7 text-brand" /> Admin Dashboard
            </h1>
            <p className="text-zinc-500 text-sm">
              Restaurant management overview & quick module navigation.
            </p>
          </div>
        </div>

        <Link
          href="/cashier"
          className="px-5 py-2.5 rounded-xl bg-brand text-white font-semibold text-sm hover:bg-brand-dark transition-all shadow-md shadow-brand/20"
        >
          Open POS Terminal
        </Link>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Low Stock Warning Banner */}
        {lowStockCount > 0 && (
          <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 text-warning-dark flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 shrink-0 text-warning" />
              <div>
                <span className="font-bold text-sm">
                  Low Stock Alert: {lowStockCount} ingredient(s) need attention!
                </span>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Items:{" "}
                  {lowStockItems
                    .map((i: any) => `${i.name} (${i.stockQuantity} ${i.unit})`)
                    .join(", ")}
                </p>
              </div>
            </div>
            <Link
              href="/admin/inventory"
              className="px-4 py-2 rounded-xl bg-warning text-white text-xs font-bold hover:bg-orange-600 transition-colors whitespace-nowrap"
            >
              Manage Inventory
            </Link>
          </div>
        )}

        {/* KPI Snapshot Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Today's Sales
            </span>
            <p className="text-2xl font-extrabold text-brand-dark mt-1">
              ₱{todaySales.toFixed(2)}
            </p>
            <span className="text-xs text-zinc-500 mt-2 block">
              {todayOrdersCount} orders completed today
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary-dark flex items-center justify-center mb-4">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Active Menu Items
            </span>
            <p className="text-2xl font-extrabold text-zinc-900 mt-1">
              {totalProductsCount}
            </p>
            <span className="text-xs text-zinc-500 mt-2 block">
              Available on POS terminal
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center mb-4">
              <Boxes className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Ingredients
            </span>
            <p className="text-2xl font-extrabold text-zinc-900 mt-1">
              {totalIngredientsCount}
            </p>
            <span className="text-xs text-zinc-500 mt-2 block">
              Base raw materials tracked
            </span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${lowStockCount > 0 ? "bg-warning/20 text-warning" : "bg-success/10 text-success"}`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Stock Status
            </span>
            <p
              className={`text-2xl font-extrabold mt-1 ${lowStockCount > 0 ? "text-warning" : "text-success"}`}
            >
              {lowStockCount > 0 ? `${lowStockCount} Low` : "Healthy"}
            </p>
            <span className="text-xs text-zinc-500 mt-2 block">
              Threshold monitoring active
            </span>
          </div>
        </div>

        {/* Module Navigation Grid */}
        <div>
          <h3 className="text-xl font-bold text-zinc-900 font-['Montserrat'] mb-4">
            Management Modules
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={idx}
                  href={mod.href}
                  className="group flex flex-col justify-between p-6 bg-white rounded-3xl border border-zinc-200/80 shadow-sm hover:shadow-xl hover:border-brand transition-all text-left"
                >
                  <div>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${mod.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-lg font-bold text-zinc-900 font-['Montserrat'] group-hover:text-brand transition-colors">
                      {mod.title}
                    </h4>
                    <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs font-semibold text-brand">
                    <span>Open module</span>
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
