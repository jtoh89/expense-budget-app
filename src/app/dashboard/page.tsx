"use client";

import { useState } from "react";
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

const SPENDING_TABLE_DATA = [
  { subCategory: "Food & Dining", yin: 10000, jon: 8200, total: 18200, budgetLeft: 4000, budgetUsed: 82, isOver: false },
  { subCategory: "Food & Dining", yin: 10000, jon: 8200, total: 18200, budgetLeft: 4000, budgetUsed: 82, isOver: true },
  { subCategory: "Food & Dining", yin: 10000, jon: 8200, total: 18200, budgetLeft: 4000, budgetUsed: 82, isOver: false },
  { subCategory: "Food & Dining", yin: 10000, jon: 8200, total: 18200, budgetLeft: 4000, budgetUsed: 82, isOver: false },
];

const MONTHLY_INCOME = [12000, 13000, 14000, 15000, 16000, 17500];
const MONTHLY_EXPENSE = [9500, 10000, 10500, 11000, 11500, 12000];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const MONTHLY_SUMMARIES = [
  {
    month: "January",
    type: "detailed" as const,
    rows: SPENDING_TABLE_DATA,
  },
  {
    month: "February",
    type: "summary" as const,
    yin: 35000,
    jon: 15000,
    total: 50000,
    leftoverBudget: -50,
  },
  {
    month: "March",
    type: "summary" as const,
    yin: 35000,
    jon: 15000,
    total: 50000,
    leftoverBudget: -50,
  },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function DashboardPage() {
  const [selectedYear, setSelectedYear] = useState("2026");
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({
    January: true,
    February: true,
    March: true,
  });

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

  const tableTotals = SPENDING_TABLE_DATA.reduce(
    (acc, row) => ({
      yin: acc.yin + row.yin,
      jon: acc.jon + row.jon,
      total: acc.total + row.total,
      budgetLeft: acc.budgetLeft + row.budgetLeft,
    }),
    { yin: 0, jon: 0, total: 0, budgetLeft: 0 }
  );

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
          Recent Month Spending (March {selectedYear})
        </p>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Sub Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Yin
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Jon
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Total
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
              {SPENDING_TABLE_DATA.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.subCategory}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(row.yin)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(row.jon)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(row.total)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(row.budgetLeft)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 max-w-[100px] overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${
                            row.isOver ? "bg-red-500" : "bg-primary"
                          }`}
                          style={{ width: `${row.budgetUsed}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {row.budgetUsed}% used
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 bg-red-50/50 font-semibold">
                <td className="px-4 py-3 text-sm text-gray-800">TOTAL</td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {formatCurrency(tableTotals.yin)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {formatCurrency(tableTotals.jon)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {formatCurrency(tableTotals.total)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {formatCurrency(tableTotals.budgetLeft)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 max-w-[100px] overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: "82%" }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">82% used</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
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
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Sub Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Yin
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Jon
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Total
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
              {SPENDING_TABLE_DATA.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.subCategory}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(row.yin)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(row.jon)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(row.total)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatCurrency(row.budgetLeft)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 max-w-[100px] overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${
                            row.isOver ? "bg-red-500" : "bg-primary"
                          }`}
                          style={{ width: `${row.budgetUsed}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {row.budgetUsed}% used
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 bg-red-50/50 font-semibold">
                <td className="px-4 py-3 text-sm text-gray-800">TOTAL</td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {formatCurrency(tableTotals.yin)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {formatCurrency(tableTotals.jon)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {formatCurrency(tableTotals.total)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {formatCurrency(tableTotals.budgetLeft)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 max-w-[100px] overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: "82%" }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">82% used</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Spending Summaries */}
      <div>
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Monthly Spending Summaries for {selectedYear}
        </h2>
        <div className="space-y-4">
          {MONTHLY_SUMMARIES.map((summary) => (
            <div
              key={summary.month}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <button
                onClick={() =>
                  setExpandedMonths((prev) => ({
                    ...prev,
                    [summary.month]: !prev[summary.month],
                  }))
                }
                className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
              >
                <span className="font-semibold text-gray-800">
                  {summary.month}
                </span>
                <svg
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    expandedMonths[summary.month] ? "rotate-180" : ""
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
              {expandedMonths[summary.month] && (
                <div className="border-t border-gray-200 px-6 pb-6 pt-2">
                  {summary.type === "detailed" ? (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                            Sub Category
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                            Yin
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                            Jon
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                            Total
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
                        {summary.rows.map((row, i) => (
                          <tr
                            key={i}
                            className="border-t border-gray-100 hover:bg-gray-50"
                          >
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {row.subCategory}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {formatCurrency(row.yin)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {formatCurrency(row.jon)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {formatCurrency(row.total)}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {formatCurrency(row.budgetLeft)}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 max-w-[80px] overflow-hidden rounded-full bg-gray-200">
                                  <div
                                    className={`h-full rounded-full ${
                                      row.isOver ? "bg-red-500" : "bg-primary"
                                    }`}
                                    style={{ width: `${row.budgetUsed}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-500">
                                  {row.budgetUsed}% used
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                            Yin
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                            Jon
                          </th>
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
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {formatCurrency(summary.yin!)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {formatCurrency(summary.jon!)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {formatCurrency(summary.total!)}
                          </td>
                          <td
                            className={`px-4 py-2 text-sm font-medium ${
                              (summary.leftoverBudget ?? 0) < 0
                                ? "text-red-600"
                                : "text-gray-700"
                            }`}
                          >
                            {formatCurrency(summary.leftoverBudget ?? 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
