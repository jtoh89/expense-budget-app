"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, CategoryScale, Tooltip, Legend);

const BUDGET_PIE_DATA = [
  { name: "Food & Dining", color: "#10b981", value: 24 },
  { name: "Transport", color: "#7dd3fc", value: 16 },
  { name: "Shopping", color: "#f97316", value: 20 },
  { name: "Bills & Utilities", color: "#ef4444", value: 14 },
  { name: "Entertainment", color: "#a78bfa", value: 10 },
  { name: "Savings & Investments", color: "#1e40af", value: 16 },
];

const PRE_TAX_ROWS = [
  { expense: "Description", monthly: 100, annual: 1200, irsLimit: 24000, match: "3%" },
  { expense: "Description", monthly: 100, annual: 1200, irsLimit: 24000, match: "3%" },
  { expense: "Description", monthly: 100, annual: 1200, irsLimit: 24000, match: "3%" },
];

const INVESTMENT_ROWS = [
  { expense: "Description", monthly: 100, annual: 1200 },
  { expense: "Description", monthly: 100, annual: 1200 },
  { expense: "Description", monthly: 100, annual: 1200 },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits === "" ? 0 : parseInt(digits, 10);
}

export default function BudgetPage() {
  const [budgetYear, setBudgetYear] = useState("2026");
  const [annualIncome, setAnnualIncome] = useState(150000);
  const [otherIncome, setOtherIncome] = useState(20000);
  const [estimatedTaxes, setEstimatedTaxes] = useState(40000);
  const [preTaxRows, setPreTaxRows] = useState(PRE_TAX_ROWS);
  const [investmentRows, setInvestmentRows] = useState(INVESTMENT_ROWS);

  const pieChartData = {
    labels: BUDGET_PIE_DATA.map((c) => c.name),
    datasets: [
      {
        data: BUDGET_PIE_DATA.map((c) => c.value),
        backgroundColor: BUDGET_PIE_DATA.map((c) => c.color),
        borderWidth: 0,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const preTaxTotals = preTaxRows.reduce(
    (acc, row) => ({
      monthly: acc.monthly + row.monthly,
      annual: acc.annual + row.annual,
    }),
    { monthly: 0, annual: 0 }
  );

  const investmentTotals = investmentRows.reduce(
    (acc, row) => ({
      monthly: acc.monthly + row.monthly,
      annual: acc.annual + row.annual,
    }),
    { monthly: 0, annual: 0 }
  );

  const adjustedGrossIncome = 123790;
  const takeHomePay = 83646;
  const investmentsTotal = 123790;
  const futureExpenseTotal = 83646;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Budget Planner */}
      <div className="mb-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Budget Planner</h1>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add New Budget
          </button>
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Budget Year
            </label>
            <select
              value={budgetYear}
              onChange={(e) => setBudgetYear(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Annual Income
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={annualIncome === 0 ? "" : formatCurrency(annualIncome)}
              onChange={(e) =>
                setAnnualIncome(parseCurrencyInput(e.target.value))
              }
              placeholder="$0"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Other Income
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={otherIncome === 0 ? "" : formatCurrency(otherIncome)}
              onChange={(e) =>
                setOtherIncome(parseCurrencyInput(e.target.value))
              }
              placeholder="$0"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Estimated Taxes{" "}
              <a
                href={`https://www.talent.com/tax-calculator?salary=${annualIncome + otherIncome || 200000}&from=year&region=California`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 cursor-pointer hover:underline"
              >
                Use link
              </a>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={estimatedTaxes === 0 ? "" : formatCurrency(estimatedTaxes)}
              onChange={(e) =>
                setEstimatedTaxes(parseCurrencyInput(e.target.value))
              }
              placeholder="$0"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Income and Take Home Pay */}
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Category Budget Allocation
        </h2>
        <div className="mb-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Adjusted Gross Income</p>
            <p className="mt-2 text-2xl font-bold text-gray-800">
              {formatCurrency(adjustedGrossIncome)}
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Take Home Pay</p>
            <p className="mt-2 text-2xl font-bold text-gray-800">
              {formatCurrency(takeHomePay)}
            </p>
          </div>
        </div>

        {/* Budget Categories */}
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Budget Categories
        </h2>
        <div className="mb-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Investments</p>
            <p className="mt-2 text-2xl font-bold text-gray-800">
              {formatCurrency(investmentsTotal)}
            </p>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Future Expense</p>
            <p className="mt-2 text-2xl font-bold text-gray-800">
              {formatCurrency(futureExpenseTotal)}
            </p>
          </div>
        </div>

        {/* Category-wise Budget Allocation */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex-1 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-semibold text-gray-800">
              Category-wise Budget Allocation
            </h3>
            <div className="flex gap-6">
              <div className="h-64 w-64 shrink-0">
                <Doughnut data={pieChartData} options={pieOptions} />
              </div>
              <div className="flex flex-col justify-center gap-2">
                {BUDGET_PIE_DATA.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-sm text-gray-700">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full lg:w-48 shrink-0">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Category
            </label>
            <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option>All Categories</option>
            </select>
          </div>
        </div>

        {/* Sub Category Budget Allocation */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex-1 rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-lg font-semibold text-gray-800">
              Sub Category Budget Allocation
            </h3>
            <div className="flex gap-6">
              <div className="h-64 w-64 shrink-0">
                <Doughnut data={pieChartData} options={pieOptions} />
              </div>
              <div className="flex flex-col justify-center gap-2">
                {BUDGET_PIE_DATA.map((c) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-sm text-gray-700">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex w-full flex-col gap-4 lg:w-48 shrink-0">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Category
              </label>
              <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option>All Categories</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Sub Categories
              </label>
              <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option>All Sub Categories</option>
              </select>
            </div>
          </div>
        </div>

        {/* Budget Expenses */}
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Budget Expenses
        </h2>

        {/* PRE-Tax */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">PRE-Tax</h3>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover transition-colors">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Expense
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Monthly
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Annual
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    IRS Limit
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Match
                  </th>
                </tr>
              </thead>
              <tbody>
                {preTaxRows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t border-gray-100 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={row.expense}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={`$${row.monthly}`}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={`$${row.annual.toLocaleString()}`}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={`$${row.irsLimit.toLocaleString()}`}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={row.match}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-800">TOTAL:</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(preTaxTotals.monthly)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(preTaxTotals.annual)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(preTaxTotals.annual)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(preTaxTotals.annual)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Investments */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">Investments</h3>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover transition-colors">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Expense
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Monthly
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Annual
                  </th>
                </tr>
              </thead>
              <tbody>
                {investmentRows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-t border-gray-100 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={row.expense}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={`$${row.monthly}`}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        defaultValue={`$${row.annual.toLocaleString()}`}
                        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-sm text-gray-800">TOTAL:</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(investmentTotals.monthly)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatCurrency(investmentTotals.annual)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
