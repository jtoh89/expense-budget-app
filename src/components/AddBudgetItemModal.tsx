"use client";

import { useState, useEffect } from "react";
import { formatCurrencyRounded, parseCurrencyInput } from "@/lib/currency";

type Subcategory = { id: string; name: string; categoryId: string | null; categoryName: string | null };

type CategoryRow = {
  subcategoryId: string;
  expense: string;
  monthly: number;
  annual: number;
  irsLimit?: number;
  match?: string;
};

type AddBudgetItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (row: CategoryRow) => void;
  sectionName: string;
  existingSubcategoryIds: string[];
  hasIrsLimit?: boolean;
  hasMatch?: boolean;
};

const matchesSubcategory = (existingId: string, subId: string) =>
  existingId === subId ||
  existingId === subId.replace(/^sub_/, "") ||
  `sub_${existingId}` === subId;

export default function AddBudgetItemModal({
  isOpen,
  onClose,
  onAdd,
  sectionName,
  existingSubcategoryIds,
  hasIrsLimit,
  hasMatch,
}: AddBudgetItemModalProps) {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [subcategoryId, setSubcategoryId] = useState("");
  const [monthly, setMonthly] = useState(0);
  const [annual, setAnnual] = useState(0);
  const [irsLimit, setIrsLimit] = useState<number | undefined>(undefined);
  const [match, setMatch] = useState("");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/subcategories")
        .then((r) => r.json())
        .then((data: Subcategory[]) => {
          setSubcategories(Array.isArray(data) ? data : []);
          setSubcategoryId("");
          setMonthly(0);
          setAnnual(0);
          setIrsLimit(undefined);
          setMatch("—");
        })
        .catch(() => setSubcategories([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const availableSubcategories = subcategories.filter((s) => {
    const matchesSection =
      s.categoryName != null &&
      s.categoryName.toLowerCase().trim() === sectionName.toLowerCase().trim();
    const notAlreadyInSection = !existingSubcategoryIds.some((eid) =>
      matchesSubcategory(eid, s.id)
    );
    return matchesSection && notAlreadyInSection;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcategoryId) return;
    const sub = subcategories.find((s) => s.id === subcategoryId);
    if (!sub) return;

    const row: CategoryRow = {
      subcategoryId,
      expense: sub.name,
      monthly,
      annual: annual || monthly * 12,
    };
    if (hasIrsLimit) row.irsLimit = irsLimit ?? 0;
    if (hasMatch) row.match = match || "—";

    onAdd(row);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Add Budget Item
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Add a new item to {sectionName}
        </p>

        {loading ? (
          <p className="py-8 text-center text-gray-500">Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="subcategory"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Subcategory
              </label>
              <select
                id="subcategory"
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select subcategory</option>
                {availableSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.categoryName ? `${s.categoryName} – ` : ""}{s.name}
                  </option>
                ))}
              </select>
              {availableSubcategories.length === 0 && !loading && (
                <p className="mt-1 text-sm text-amber-600">
                  No subcategories available for this section.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="monthly"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Monthly
                </label>
                <input
                  id="monthly"
                  type="text"
                  inputMode="numeric"
                  value={monthly === 0 ? "" : formatCurrencyRounded(monthly)}
                  onChange={(e) => setMonthly(parseCurrencyInput(e.target.value))}
                  placeholder="$0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="annual"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Annual
                </label>
                <input
                  id="annual"
                  type="text"
                  inputMode="numeric"
                  value={annual === 0 ? "" : formatCurrencyRounded(annual)}
                  onChange={(e) => setAnnual(parseCurrencyInput(e.target.value))}
                  placeholder="$0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {hasIrsLimit && (
              <div>
                <label
                  htmlFor="irsLimit"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  IRS Limit
                </label>
                <input
                  id="irsLimit"
                  type="text"
                  inputMode="numeric"
                  value={irsLimit != null && irsLimit > 0 ? formatCurrencyRounded(irsLimit) : ""}
                  onChange={(e) => setIrsLimit(parseCurrencyInput(e.target.value))}
                  placeholder="$0"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {hasMatch && (
              <div>
                <label
                  htmlFor="match"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Match
                </label>
                <input
                  id="match"
                  type="text"
                  value={match}
                  onChange={(e) => setMatch(e.target.value)}
                  placeholder="e.g. 4%"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!subcategoryId || availableSubcategories.length === 0}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
