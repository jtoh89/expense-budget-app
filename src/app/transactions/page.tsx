"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AddTransactionModal from "@/components/AddTransactionModal";
import DeleteTransactionsModal from "@/components/DeleteTransactionsModal";
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
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [selectedOwners, setSelectedOwners] = useState<string[]>([]);
  const [owners, setOwners] = useState<string[]>([]);
  const [ownersDropdownOpen, setOwnersDropdownOpen] = useState(false);
  const ownersDropdownRef = useRef<HTMLDivElement>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [deletePending, setDeletePending] = useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/subcategories")
      .then((r) => r.json())
      .then((data) => setSubCategories(Array.isArray(data) ? data : []))
      .catch(() => setSubCategories([]));
  }, []);

  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then((data) => {
        const cards = Array.isArray(data) ? data : [];
        const ownerSet = new Set<string>();
        for (const c of cards) {
          if (c.owner) ownerSet.add(c.owner);
        }
        setOwners(Array.from(ownerSet).sort());
      })
      .catch(() => setOwners([]));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ownersDropdownRef.current && !ownersDropdownRef.current.contains(e.target as Node)) {
        setOwnersDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ownersParam = selectedOwners.length > 0 ? selectedOwners.join(",") : "";
      const res = await fetch(
        `/api/transactions?page=${currentPage}&limit=50&sortBy=${sortBy}&sortDir=${sortDir}&incompleteOnly=${showIncompleteOnly}&owners=${encodeURIComponent(ownersParam)}`
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
  }, [currentPage, sortBy, sortDir, showIncompleteOnly, selectedOwners]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleAddSuccess = () => {
    fetchTransactions();
  };

  const openDeleteModal = (tx: Transaction) => {
    setDeletePending(tx);
    setDeleteError(null);
  };

  const closeDeleteModal = () => {
    setDeletePending(null);
    setDeleteError(null);
  };

  const confirmDeleteTransaction = async () => {
    if (!deletePending) return;
    setDeleteError(null);
    try {
      const res = await fetch(`/api/transactions/${deletePending.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      closeDeleteModal();
      fetchTransactions();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    }
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
          <div className="relative" ref={ownersDropdownRef}>
            <button
              type="button"
              onClick={() => setOwnersDropdownOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
            >
              <span className="truncate">
                {selectedOwners.length === 0
                  ? "All Owners"
                  : `${selectedOwners.length} selected`}
              </span>
              <svg className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${ownersDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {ownersDropdownOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                {owners.length === 0 ? (
                  <p className="px-4 py-2 text-sm text-gray-500">No owners</p>
                ) : (
                  owners.map((owner) => (
                    <label key={owner} className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={
                          selectedOwners.length === 0 ||
                          selectedOwners.includes(owner)
                        }
                        onChange={() => {
                          setSelectedOwners((prev) => {
                            const next = prev.length === 0
                              ? owners.filter((n) => n !== owner)
                              : prev.includes(owner)
                                ? prev.filter((n) => n !== owner)
                                : [...prev, owner];
                            return next.length === owners.length ? [] : next;
                          });
                          setCurrentPage(1);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{owner}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Show Incomplete Only</span>
            <button
              type="button"
              role="switch"
              aria-checked={showIncompleteOnly}
              onClick={() => {
                setShowIncompleteOnly((v) => !v);
                setCurrentPage(1);
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                showIncompleteOnly ? "bg-primary" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                  showIncompleteOnly ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
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
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white transition-colors hover:bg-red-700"
            aria-label="Delete transactions by import"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
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
                    <th className="w-10 px-4 py-3 text-left text-sm font-semibold text-gray-700" />
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
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openDeleteModal(row)}
                          className="flex h-6 w-6 items-center justify-center rounded text-red-600 transition-colors hover:bg-red-50"
                          aria-label={`Delete transaction ${row.description}`}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
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
      <DeleteTransactionsModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Delete Transaction Confirmation Modal */}
      {deletePending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDeleteModal}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Delete Transaction?
            </h2>
            <p className="mb-2 text-sm text-gray-600">
              Are you sure you want to delete &quot;{deletePending.description}&quot;?
            </p>
            <p className="mb-6 text-sm text-gray-600">
              This action cannot be undone.
            </p>
            {deleteError && (
              <p className="mb-4 text-sm text-red-600">{deleteError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteTransaction}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
