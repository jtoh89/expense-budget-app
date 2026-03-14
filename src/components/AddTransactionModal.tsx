"use client";

import { useState, useEffect } from "react";

type Card = { id: string; name: string; owner: string; label: string };
type SubCategory = { id: string; name: string; categoryId: string; categoryName: string };

type AddTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AddTransactionModal({
  isOpen,
  onClose,
  onSuccess,
}: AddTransactionModalProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch("/api/cards").then((r) => r.json()),
        fetch("/api/subcategories").then((r) => r.json()),
      ])
        .then(([cardsRes, subRes]) => {
          if (cardsRes.error) throw new Error(cardsRes.error);
          if (subRes.error) throw new Error(subRes.error);
          setCards(Array.isArray(cardsRes) ? cardsRes : cardsRes.data || []);
          setSubCategories(
            Array.isArray(subRes) ? subRes : subRes.data || []
          );
        })
        .catch((err) => setError(err.message));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const cardId = (form.elements.namedItem("cardId") as HTMLSelectElement)
      .value;
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    const description = (
      form.elements.namedItem("description") as HTMLInputElement
    ).value;
    const subCategoryId = (
      form.elements.namedItem("subCategory") as HTMLSelectElement
    ).value;
    const amount = parseFloat(
      (form.elements.namedItem("amount") as HTMLInputElement).value
    );

    if (!cardId || !date || !description || isNaN(amount)) return;

    setLoading(true);
    setError(null);

    const debit = amount > 0 ? amount : 0;
    const credit = amount < 0 ? Math.abs(amount) : 0;

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          date,
          description,
          debit,
          credit,
          subCategoryId: subCategoryId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add transaction");

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Add Transaction
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="cardId"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Card
            </label>
            <select
              id="cardId"
              name="cardId"
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select Card</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </span>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="Enter Description"
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div>
            <label
              htmlFor="subCategory"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Sub Category
            </label>
            <select
              id="subCategory"
              name="subCategory"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Sub Category</option>
              {subCategories.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-500">
            Category will be autofilled here
          </p>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            placeholder="Amount (positive=debit, negative=credit)"
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-primary bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
