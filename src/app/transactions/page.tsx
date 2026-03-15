"use client";

import { useState, useEffect, useCallback } from "react";
import AddTransactionModal from "@/components/AddTransactionModal";
import SubCategoryAutocomplete, { type SubCategory } from "@/components/SubCategoryAutocomplete";

type Transaction = {
  id: string;
  owner: string;
  cardName: string;
  date: string;
  description: string;
  debit: string;
  credit: string;
  subCategoryId: string | null;
  subCategory: string;
  category: string;
};

type SortBy = "date" | "owner" | "cardName" | "description" | "debit" | "credit" | "subCategory" | "category";
type SortDir = "asc" | "desc";

export default function TransactionsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch("/api/subcategories")
      .then((r) => r.json())
      .then((data) => setSubCategories(Array.isArray(data) ? data : []))
      .catch(() => setSubCategories([]));
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/transactions?page=${currentPage}&limit=100&sortBy=${sortBy}&sortDir=${sortDir}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch");
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transactions");
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortDir]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAddSuccess = () => {
    fetchTransactions();
  };

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir(column === "date" ? "desc" : "asc");
    }
    setCurrentPage(1);
  };

  const SortHeader = ({ column, children }: { column: SortBy; children: React.ReactNode }) => (
    <th
      className="cursor-pointer select-none px-4 py-3 text-left text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
      onClick={() => handleSort(column)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          <span className="text-primary" aria-hidden>
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    </th>
  );

  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => i + 1
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        <div className="flex flex-wrap items-center gap-3">
          <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option>This Month</option>
          </select>
          <select className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option>All categories</option>
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
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <SortHeader column="owner">Owner</SortHeader>
                    <SortHeader column="cardName">Card</SortHeader>
                    <SortHeader column="date">Date</SortHeader>
                    <SortHeader column="description">Description</SortHeader>
                    <SortHeader column="debit">Debit</SortHeader>
                    <SortHeader column="credit">Credit</SortHeader>
                    <SortHeader column="subCategory">Sub Category</SortHeader>
                    <SortHeader column="category">Category</SortHeader>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((row, i) => (
                    <tr
                      key={row.id}
                      className={`border-t border-gray-100 hover:bg-gray-50 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.owner}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.cardName}
                      </td>
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
                        <SubCategoryAutocomplete
                          transactionId={row.id}
                          value={row.subCategory}
                          subCategoryId={row.subCategoryId}
                          subCategories={subCategories}
                          onUpdate={fetchTransactions}
                        />
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
                disabled={currentPage <= 1}
                className="rounded px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Prev
              </button>
              {pageNumbers.map((page) => (
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="rounded px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
}
