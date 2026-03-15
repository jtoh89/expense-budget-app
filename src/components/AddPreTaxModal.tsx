"use client";

import { useState } from "react";
import { formatCurrency, parseCurrencyInput } from "@/lib/currency";

function parsePercentInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  return cleaned;
}

export type PreTaxRow = {
  expense: string;
  monthly: number;
  annual: number;
  irsLimit: number;
  match: string;
};

type AddPreTaxModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (row: PreTaxRow) => void;
};

export default function AddPreTaxModal({
  isOpen,
  onClose,
  onAdd,
}: AddPreTaxModalProps) {
  const [monthly, setMonthly] = useState(0);
  const [irsLimit, setIrsLimit] = useState(0);
  const [match, setMatch] = useState("");

  if (!isOpen) return null;

  const annual = monthly * 12;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const expense = (form.elements.namedItem("expense") as HTMLInputElement)
      .value;
    if (expense && monthly > 0) {
      onAdd?.({
        expense,
        monthly,
        annual,
        irsLimit,
        match: match ? `${match}%` : "",
      });
      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setMonthly(0);
    setIrsLimit(0);
    setMatch("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Add New PRE-Tax Expense
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            id="expense"
            name="expense"
            type="text"
            placeholder="Enter Expense"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div>
            <label
              htmlFor="monthly"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Monthly
            </label>
            <input
              id="monthly"
              name="monthly"
              type="text"
              inputMode="numeric"
              value={monthly === 0 ? "" : formatCurrency(monthly)}
              onChange={(e) => setMonthly(parseCurrencyInput(e.target.value))}
              placeholder="Enter Monthly Amount"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Annual
            </label>
            <p className="text-sm text-gray-500">
              {formatCurrency(annual)}
            </p>
          </div>
          <div>
            <label
              htmlFor="irsLimit"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              IRS Limit
            </label>
            <input
              id="irsLimit"
              name="irsLimit"
              type="text"
              inputMode="numeric"
              value={irsLimit === 0 ? "" : formatCurrency(irsLimit)}
              onChange={(e) => setIrsLimit(parseCurrencyInput(e.target.value))}
              placeholder="Enter IRS Limit"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="match"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Match
            </label>
            <input
              id="match"
              name="match"
              type="text"
              inputMode="numeric"
              value={match}
              onChange={(e) => setMatch(parsePercentInput(e.target.value))}
              placeholder="e.g. 3"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-primary bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
