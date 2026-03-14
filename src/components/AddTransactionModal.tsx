"use client";

const MOCK_SUB_CATEGORIES = [
  { value: "subscriptions", label: "Subscriptions", category: "Entertainment" },
  { value: "groceries", label: "Groceries", category: "Food" },
  { value: "gas", label: "Gas", category: "Transportation" },
];

type AddTransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (data: {
    date: string;
    description: string;
    subCategory: string;
    subCategoryLabel: string;
    category: string;
    amount: number;
  }) => void;
};

export default function AddTransactionModal({
  isOpen,
  onClose,
  onAdd,
}: AddTransactionModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const date = (form.elements.namedItem("date") as HTMLInputElement).value;
    const description = (
      form.elements.namedItem("description") as HTMLInputElement
    ).value;
    const subCategory = (
      form.elements.namedItem("subCategory") as HTMLSelectElement
    ).value;
    const amount = parseFloat(
      (form.elements.namedItem("amount") as HTMLInputElement).value
    );
    const selected = MOCK_SUB_CATEGORIES.find((s) => s.value === subCategory);
    const category = selected?.category ?? "";
    const subCategoryLabel = selected?.label ?? subCategory;
    if (date && description && subCategory && !isNaN(amount)) {
      onAdd?.({ date, description, subCategory, subCategoryLabel, category, amount });
      onClose();
    }
  };

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
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
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
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </div>

          <input
            id="description"
            name="description"
            type="text"
            placeholder="Enter Description"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <select
            id="subCategory"
            name="subCategory"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Sub Category</option>
            {MOCK_SUB_CATEGORIES.map((sub) => (
              <option key={sub.value} value={sub.value}>
                {sub.label}
              </option>
            ))}
          </select>

          <p className="text-sm text-gray-500">
            Category will be autofilled here
          </p>

          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            placeholder="Amount"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
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
