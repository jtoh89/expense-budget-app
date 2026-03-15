"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/currency";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const EXPENSE_CATEGORIES = [
  { name: "Food", color: "#10b981", value: 26.1 },
  { name: "Travel", color: "#3b82f6", value: 22.8 },
  { name: "Entertainment", color: "#f97316", value: 16.3 },
  { name: "Shopping", color: "#ef4444", value: 13.1 },
  { name: "Others", color: "#6b7280", value: 21.7 },
];

type BreakdownRow = {
  subCategory: string;
  byOwner: Record<string, number>;
  total: number;
  budget: number;
  budgetLeft: number;
  budgetUsed: number;
  isOver: boolean;
};

const getBudgetBarColor = (pct: number) => {
  if (pct < 100) return "bg-primary";
  if (pct <= 110) return "bg-red-400";
  return "bg-red-700";
};

const MONTHLY_INCOME = [12000, 13000, 14000, 15000, 16000, 17500];
const MONTHLY_EXPENSE = [9500, 10000, 10500, 11000, 11500, 12000];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState("2026");
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [recentMonthBreakdown, setRecentMonthBreakdown] = useState<{
    monthName: string;
    year: number;
    month: number;
    owners: string[];
    rows: BreakdownRow[];
    totals: { byOwner: Record<string, number>; total: number; budget: number; budgetLeft: number; budgetUsed: number };
  } | null>(null);
  const [recentMonthLoading, setRecentMonthLoading] = useState(true);
  const [recentMonthError, setRecentMonthError] = useState<string | null>(null);

  const [monthlyBreakdowns, setMonthlyBreakdowns] = useState<{
    owners: string[];
    months: { month: number; monthName: string; rows: BreakdownRow[]; totals: { byOwner: Record<string, number>; total: number; budget: number; budgetLeft: number; budgetUsed: number } }[];
    ytd: { rows: BreakdownRow[]; totals: { byOwner: Record<string, number>; total: number; budget: number; budgetLeft: number; budgetUsed: number } };
  } | null>(null);
  const [monthlyBreakdownsLoading, setMonthlyBreakdownsLoading] = useState(true);
  const [monthlyBreakdownsError, setMonthlyBreakdownsError] = useState<string | null>(null);

  const fetchRecentMonthBreakdown = useCallback(async () => {
    const yearNum = parseInt(selectedYear, 10);
    const now = new Date();
    const month = yearNum === now.getFullYear() ? now.getMonth() + 1 : 12;

    setRecentMonthLoading(true);
    setRecentMonthError(null);
    try {
      const res = await fetch(
        `/api/dashboard/subcategory-breakdown?year=${yearNum}&month=${month}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setRecentMonthBreakdown(data);
    } catch (err) {
      setRecentMonthError(err instanceof Error ? err.message : "Failed to load");
      setRecentMonthBreakdown(null);
    } finally {
      setRecentMonthLoading(false);
    }
  }, [selectedYear]);

  const fetchMonthlyBreakdowns = useCallback(async () => {
    const yearNum = parseInt(selectedYear, 10);
    setMonthlyBreakdownsLoading(true);
    setMonthlyBreakdownsError(null);
    try {
      const res = await fetch(`/api/dashboard/monthly-breakdowns?year=${yearNum}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setMonthlyBreakdowns(data);
      setExpandedMonths(() => {
        const next: Record<string, boolean> = {};
        for (const m of data.months ?? []) {
          next[m.monthName] = (m.rows?.length ?? 0) > 0;
        }
        return next;
      });
    } catch (err) {
      setMonthlyBreakdownsError(err instanceof Error ? err.message : "Failed to load");
      setMonthlyBreakdowns(null);
    } finally {
      setMonthlyBreakdownsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchRecentMonthBreakdown();
  }, [fetchRecentMonthBreakdown]);

  useEffect(() => {
    fetchMonthlyBreakdowns();
  }, [fetchMonthlyBreakdowns]);

  const pieData = {
    labels: EXPENSE_CATEGORIES.map((c) => c.name),
    datasets: [
      {
        data: EXPENSE_CATEGORIES.map((c) => c.value),
        backgroundColor: EXPENSE_CATEGORIES.map((c) => c.color),
        borderWidth: 0,
      },
    ],
  };

  const lineData = {
    labels: MONTHS,
    datasets: [
      {
        label: "Income",
        data: MONTHLY_INCOME,
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.3,
      },
      {
        label: "Expense",
        data: MONTHLY_EXPENSE,
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  const pieOptions = {
    ...chartOptions,
    cutout: "60%",
    plugins: {
      ...chartOptions.plugins,
      legend: {
        position: "right" as const,
      },
    },
  };


  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Spending Summary */}
      <div className="mb-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Spending Summary</h1>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
        <p className="mb-6 text-xl font-bold text-gray-800">
          Recent Month Spending ({recentMonthBreakdown?.monthName ?? "—"} {selectedYear})
        </p>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {recentMonthLoading ? (
            <div className="flex justify-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : recentMonthError ? (
            <div className="flex justify-center py-12">
              <p className="text-red-600">{recentMonthError}</p>
            </div>
          ) : recentMonthBreakdown && recentMonthBreakdown.rows.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Sub Category
                  </th>
                  {recentMonthBreakdown.owners.map((owner) => (
                    <th key={owner} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {owner}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Monthly Budget
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Budget Left
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Budget Usage
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentMonthBreakdown.rows.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {row.subCategory}
                    </td>
                    {recentMonthBreakdown.owners.map((owner) => (
                      <td key={owner} className="px-4 py-3 text-sm text-gray-700">
                        {formatCurrency(row.byOwner[owner] ?? 0)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(row.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(row.budget)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(row.budgetLeft)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 max-w-[100px] overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${getBudgetBarColor(row.budgetUsed)}`}
                            style={{ width: `${Math.min(row.budgetUsed, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {row.budgetUsed}% used
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-800">TOTAL</td>
                  {recentMonthBreakdown.owners.map((owner) => (
                    <td key={owner} className="px-4 py-3 text-sm text-gray-800">
                      {formatCurrency(recentMonthBreakdown.totals.byOwner[owner] ?? 0)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(recentMonthBreakdown.totals.total)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(recentMonthBreakdown.totals.budget)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(recentMonthBreakdown.totals.budgetLeft)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 max-w-[100px] overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${getBudgetBarColor(recentMonthBreakdown.totals.budgetUsed)}`}
                          style={{ width: `${Math.min(recentMonthBreakdown.totals.budgetUsed, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {recentMonthBreakdown.totals.budgetUsed}% used
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No transactions for this month
            </div>
          )}
        </div>
      </div>

      {/* Year to Date Spending */}
      <div className="mb-10">
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Year to Date Spending
        </h2>
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">
              Spending vs Budget
            </h3>
            <p className="mb-4 text-sm text-gray-500">Monthly trend</p>
            <div className="h-64">
              <Line data={lineData} options={chartOptions} />
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">
              Expense Breakdown
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              This month&apos;s spending by category
            </p>
            <div className="h-48 w-48 shrink-0">
              <Doughnut data={pieData} options={pieOptions} />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {monthlyBreakdownsLoading ? (
            <div className="flex justify-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : monthlyBreakdownsError ? (
            <div className="flex justify-center py-12">
              <p className="text-red-600">{monthlyBreakdownsError}</p>
            </div>
          ) : monthlyBreakdowns?.ytd && monthlyBreakdowns.ytd.rows.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Sub Category
                  </th>
                  {monthlyBreakdowns.owners.map((owner) => (
                    <th key={owner} className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {owner}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    YTD Budget
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Budget Left
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Budget Usage
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdowns.ytd.rows.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {row.subCategory}
                    </td>
                    {monthlyBreakdowns.owners.map((owner) => (
                      <td key={owner} className="px-4 py-3 text-sm text-gray-700">
                        {formatCurrency(row.byOwner[owner] ?? 0)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(row.total)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(row.budget)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(row.budgetLeft)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 max-w-[100px] overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full ${getBudgetBarColor(row.budgetUsed)}`}
                            style={{ width: `${Math.min(row.budgetUsed, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {row.budgetUsed}% used
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-800">TOTAL</td>
                  {monthlyBreakdowns.owners.map((owner) => (
                    <td key={owner} className="px-4 py-3 text-sm text-gray-800">
                      {formatCurrency(monthlyBreakdowns.ytd.totals.byOwner[owner] ?? 0)}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(monthlyBreakdowns.ytd.totals.total)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(monthlyBreakdowns.ytd.totals.budget)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(monthlyBreakdowns.ytd.totals.budgetLeft)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 max-w-[100px] overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${getBudgetBarColor(monthlyBreakdowns.ytd.totals.budgetUsed)}`}
                          style={{ width: `${Math.min(monthlyBreakdowns.ytd.totals.budgetUsed, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {monthlyBreakdowns.ytd.totals.budgetUsed}% used
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-gray-500">
              No transactions for this year
            </div>
          )}
        </div>
      </div>

      {/* Monthly Spending Summaries */}
      <div>
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Monthly Spending Summaries for {selectedYear}
        </h2>
        <div className="space-y-4">
          {monthlyBreakdownsLoading ? (
            <div className="flex justify-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : monthlyBreakdownsError ? (
            <div className="flex justify-center py-12">
              <p className="text-red-600">{monthlyBreakdownsError}</p>
            </div>
          ) : (
            (monthlyBreakdowns?.months ?? []).map((m) => (
              <div
                key={m.month}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <button
                  onClick={() =>
                    setExpandedMonths((prev) => ({
                      ...prev,
                      [m.monthName]: !prev[m.monthName],
                    }))
                  }
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
                >
                  <span className="font-semibold text-gray-800">
                    {m.monthName}
                  </span>
                  <svg
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      expandedMonths[m.monthName] ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedMonths[m.monthName] && (
                  <div className="border-t border-gray-200 px-6 pb-6 pt-2">
                    {m.rows.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                              Sub Category
                            </th>
                            {(monthlyBreakdowns?.owners ?? []).map((owner) => (
                              <th key={owner} className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                                {owner}
                              </th>
                            ))}
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                              Total
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                              Monthly Budget
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                              Budget Left
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                              Budget Usage
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {m.rows.map((row, i) => (
                            <tr
                              key={i}
                              className="border-t border-gray-100 hover:bg-gray-50"
                            >
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {row.subCategory}
                              </td>
                              {(monthlyBreakdowns?.owners ?? []).map((owner) => (
                                <td key={owner} className="px-4 py-2 text-sm text-gray-700">
                                  {formatCurrency(row.byOwner[owner] ?? 0)}
                                </td>
                              ))}
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {formatCurrency(row.total)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {formatCurrency(row.budget)}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-700">
                                {formatCurrency(row.budgetLeft)}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 flex-1 max-w-[80px] overflow-hidden rounded-full bg-gray-200">
                                    <div
                                      className={`h-full rounded-full ${getBudgetBarColor(row.budgetUsed)}`}
                                      style={{ width: `${Math.min(row.budgetUsed, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {row.budgetUsed}% used
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                            <td className="px-4 py-2 text-sm text-gray-800">TOTAL</td>
                            {(monthlyBreakdowns?.owners ?? []).map((owner) => (
                              <td key={owner} className="px-4 py-2 text-sm text-gray-800">
                                {formatCurrency(m.totals.byOwner[owner] ?? 0)}
                              </td>
                            ))}
                            <td className="px-4 py-2 text-sm text-gray-800">
                              {formatCurrency(m.totals.total)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-800">
                              {formatCurrency(m.totals.budget)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-800">
                              {formatCurrency(m.totals.budgetLeft)}
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-xs text-gray-500">
                                {m.totals.budgetUsed}% used
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            {(monthlyBreakdowns?.owners ?? []).map((owner) => (
                              <th key={owner} className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                                {owner}
                              </th>
                            ))}
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                              Total
                            </th>
                            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                              Budget Left
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-gray-100 hover:bg-gray-50">
                            {(monthlyBreakdowns?.owners ?? []).map((owner) => (
                              <td key={owner} className="px-4 py-2 text-sm text-gray-700">
                                {formatCurrency(m.totals.byOwner[owner] ?? 0)}
                              </td>
                            ))}
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {formatCurrency(m.totals.total)}
                            </td>
                            <td
                              className={`px-4 py-2 text-sm font-medium ${
                                (m.totals.budgetLeft ?? 0) < 0
                                  ? "text-red-600"
                                  : "text-gray-700"
                              }`}
                            >
                              {formatCurrency(m.totals.budgetLeft ?? 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
