"use client";

import { useState } from "react";
import { formatCurrency, parseCurrencyInput } from "@/lib/currency";

type AddNewInvestmentsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (expense: string, monthlyAmount: number) => void;
};

export default function AddNewInvestmentsModal({
  isOpen,
  onClose,
  onAdd,
}: AddNewInvestmentsModalProps) {
  const [monthlyAmount, setMonthlyAmount] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const expense = (form.elements.namedItem("expense") as HTMLInputElement)
      .value;
    if (expense && monthlyAmount > 0) {
      onAdd?.(expense, monthlyAmount);
      setMonthlyAmount(0);
      onClose();
    }
  };

  const handleClose = () => {
    setMonthlyAmount(0);
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
          Add New Investments
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            id="expense"
            name="expense"
            type="text"
            placeholder="Enter Expense"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            id="monthlyAmount"
            name="monthlyAmount"
            type="text"
            inputMode="numeric"
            value={monthlyAmount === 0 ? "" : formatCurrency(monthlyAmount)}
            onChange={(e) =>
              setMonthlyAmount(parseCurrencyInput(e.target.value))
            }
            placeholder="Enter Monthly Amount"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-sm text-gray-500">
            Annual Amount: {formatCurrency(monthlyAmount * 12)}
          </p>
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
