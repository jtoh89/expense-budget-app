"use client";

import { useState } from "react";
import AddTransactionModal from "@/components/AddTransactionModal";

const MOCK_TRANSACTIONS = Array.from({ length: 10 }, (_, i) => ({
  card: i % 2 === 0 ? "Yin - Chase Reserve" : "Yin - Amex",
  date: "15 Oct 2025",
  description: "Description",
  debit: i % 2 === 0 ? "$100" : "",
  credit: i % 2 === 0 ? "" : "$100",
  subCategory: "Sub Category",
  category: "Category",
}));

export default function TransactionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        <div className="flex flex-wrap items-center gap-3">
          <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option>This Month</option>
          </select>
          <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option>All Category</option>
          </select>
          <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option>All Types</option>
          </select>
          <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option>Newest First</option>
          </select>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="ml-auto flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
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
            Add Transaction
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Card
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Debit
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Credit
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Sub Category
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Category
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((row, i) => (
                <tr
                  key={i}
                  className={`border-t border-gray-100 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  } hover:bg-gray-50`}
                >
                  <td className="px-4 py-3 text-sm text-gray-700">{row.card}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.date}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.debit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.credit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.subCategory}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {row.category}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="rounded px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Prev
          </button>
          {[1, 2, 3].map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                currentPage === page
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
            className="rounded px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(data) => {
          const isDebit = data.amount > 0;
          const formattedDate = new Date(data.date + "T00:00:00").toLocaleDateString(
            "en-GB",
            { day: "numeric", month: "short", year: "numeric" }
          );
          setTransactions((prev) => [
            {
              card: "Yin - Chase Reserve",
              date: formattedDate,
              description: data.description,
              debit: isDebit ? `$${data.amount}` : "",
              credit: !isDebit ? `$${Math.abs(data.amount)}` : "",
              subCategory: data.subCategoryLabel,
              category: data.category,
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
}
