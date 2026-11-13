"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Receipt,
  ShoppingBag,
  PieChart,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { getFinancialReports } from "./actions";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setIsLoading(true);
    const data = await getFinancialReports();
    setReportData(data);
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center font-sans">
        <p className="text-zinc-500 font-medium">
          Loading financial reports...
        </p>
      </div>
    );
  }

  const {
    totalGrossRevenue,
    totalEstimatedFoodCost,
    grossProfit,
    totalOperationalExpenses,
    netProfit,
    netProfitMargin,
    totalOrdersCount,
    totalItemSalesCount,
    topSellingProducts,
    recentOrders,
  } = reportData;

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark font-['Montserrat'] flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-brand" /> Financial &
              Profitability Reports
            </h1>
            <p className="text-zinc-500 text-sm">
              Analyze total revenue, ingredient food costs, operational
              expenses, and net profit margins.
            </p>
          </div>
        </div>

        <button
          onClick={loadReports}
          className="px-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs cursor-pointer"
        >
          Refresh Data
        </button>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* KPI Financial Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gross Revenue */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Gross Revenue
            </span>
            <p className="text-2xl font-extrabold text-brand-dark mt-1">
              ₱{totalGrossRevenue.toFixed(2)}
            </p>
            <span className="text-xs text-zinc-500 mt-2 block">
              {totalOrdersCount} completed orders
            </span>
          </div>

          {/* Ingredient Food Cost */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary-dark flex items-center justify-center mb-4">
              <PieChart className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Food Cost
            </span>
            <p className="text-2xl font-extrabold text-secondary-dark mt-1">
              ₱{totalEstimatedFoodCost.toFixed(2)}
            </p>
            <span className="text-xs text-zinc-500 mt-2 block">
              Deducted from recipe BOMs
            </span>
          </div>

          {/* Operational Expenses */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center mb-4">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Overhead Expenses
            </span>
            <p className="text-2xl font-extrabold text-danger mt-1">
              ₱{totalOperationalExpenses.toFixed(2)}
            </p>
            <span className="text-xs text-zinc-500 mt-2 block">
              Rent, utilities, consumables
            </span>
          </div>

          {/* Net Profit */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-sm">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${netProfit >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
            >
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Net Profit
            </span>
            <p
              className={`text-2xl font-extrabold mt-1 ${netProfit >= 0 ? "text-success" : "text-danger"}`}
            >
              ₱{netProfit.toFixed(2)}
            </p>
            <span className="text-xs text-zinc-500 mt-2 block">
              Margin:{" "}
              <strong className="text-zinc-800">
                {netProfitMargin.toFixed(1)}%
              </strong>
            </span>
          </div>
        </div>

        {/* Detailed Breakdown Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Selling Menu Items */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6">
            <h3 className="text-lg font-bold text-zinc-900 font-['Montserrat'] mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand" /> Top Selling Menu
              Items
            </h3>

            {topSellingProducts.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">
                No sales recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {topSellingProducts.map((prod: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-brand/10 text-brand font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-zinc-900 text-sm">
                        {prod.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-brand-dark text-sm">
                        {prod.qtySold} sold
                      </span>
                      <span className="block text-xs text-zinc-400">
                        ₱{prod.revenue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent POS Orders */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6">
            <h3 className="text-lg font-bold text-zinc-900 font-['Montserrat'] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand" /> Recent POS
              Transactions
            </h3>

            {recentOrders.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">
                No orders processed yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((ord: any) => (
                  <div
                    key={ord.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100"
                  >
                    <div>
                      <span className="font-bold text-zinc-900 text-sm uppercase">
                        #{ord.id}
                      </span>
                      <p className="text-xs text-zinc-400">
                        {new Date(ord.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-brand-dark text-sm">
                        ₱{ord.totalAmount.toFixed(2)}
                      </span>
                      <span className="block text-[10px] font-bold text-secondary uppercase bg-secondary/10 px-2 py-0.5 rounded-full mt-0.5">
                        {ord.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
