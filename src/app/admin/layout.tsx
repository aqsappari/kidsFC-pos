"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PackagePlus,
  ChefHat,
  Boxes,
  UtensilsCrossed,
  Receipt,
  TrendingUp,
  LogOut,
  Utensils,
} from "lucide-react";

const adminNavItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Stock-In Purchases", href: "/admin/purchases", icon: PackagePlus },
  { name: "Recipes & BOM", href: "/admin/recipes", icon: ChefHat },
  { name: "Inventory", href: "/admin/inventory", icon: Boxes },
  { name: "Products & Menu", href: "/admin/products", icon: UtensilsCrossed },
  { name: "Expenses", href: "/admin/expenses", icon: Receipt },
  { name: "Reports", href: "/admin/reports", icon: TrendingUp },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col md:flex-row font-sans">
      {/* Sidebar Navigation (Desktop) / Top Bar (Mobile) */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Brand Header */}
          <div className="p-6 border-b border-zinc-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center shadow-md shadow-brand/20">
              <Utensils className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-extrabold text-brand-dark font-['Montserrat'] tracking-tight">
                KIDS
              </h2>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold text-sm transition-all ${
                    isActive
                      ? "bg-brand text-white shadow-md shadow-brand/20"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-primary" : "text-zinc-400"}`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer / Quick Exit */}
        <div className="p-4 border-t border-zinc-100 space-y-2">
          <Link
            href="/cashier"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-secondary/10 hover:bg-secondary/20 text-secondary-dark font-bold text-xs transition-colors"
          >
            Switch to POS Terminal
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" /> Exit to Gate
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
