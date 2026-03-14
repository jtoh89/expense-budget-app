"use client";

import { useState, useCallback } from "react";
import AddNewCardModal from "@/components/AddNewCardModal";

const MOCK_CARDS = [
  "YIN - Chase Reserve",
  "YIN - Amex",
  "Personal - Visa",
];

const MOCK_PREVIEW = [
  { date: "10 Oct 2025", description: "Netflix Subscription", amount: 499 },
  { date: "10 Oct 2025", description: "Netflix Subscription", amount: 499 },
  { date: "10 Oct 2025", description: "Netflix Subscription", amount: -499 },
  { date: "10 Oct 2025", description: "Netflix Subscription", amount: 499 },
];

export default function ImportPage() {
  const [selectedCard, setSelectedCard] = useState(MOCK_CARDS[0]);
  const [cards, setCards] = useState(MOCK_CARDS);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<typeof MOCK_PREVIEW | null>(
    MOCK_PREVIEW
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) {
      setPreviewData(MOCK_PREVIEW);
    }
  }, []);

  const handleReset = () => {
    setSelectedCard(cards[0]);
    setPreviewData(null);
  };

  const handleAddCard = (owner: string, cardName: string) => {
    const newCard = `${owner.toUpperCase()} - ${cardName}`;
    setCards((prev) => [...prev, newCard]);
    setSelectedCard(newCard);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Import Expenses CSV
          </h1>
          <p className="mt-1 text-sm text-gray-500">Import csv</p>
        </div>
        <button
          onClick={handleReset}
          className="rounded-lg bg-accent-orange px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <label className="mb-2 flex items-center gap-1 text-sm font-semibold text-gray-800">
            Select Card
            <button
              type="button"
              onClick={() => setIsAddCardModalOpen(true)}
              className="text-primary hover:text-primary-hover"
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
            </button>
          </label>
          <select
            value={selectedCard}
            onChange={(e) => setSelectedCard(e.target.value)}
            className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {cards.map((card) => (
              <option key={card} value={card}>
                {card}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-8">
          <label className="mb-2 block text-sm font-semibold text-gray-800">
            Import File here
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex min-h-[180px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-gray-300 bg-gray-50 hover:border-gray-400"
            }`}
          >
            <p className="text-lg font-medium text-gray-500">
              Drag and drop file here
            </p>
          </div>
        </div>

        {previewData && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Preview Transactions
              </h2>
              <button className="text-sm font-medium text-blue-600 hover:underline">
                View All
              </button>
            </div>
            <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.description}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-medium ${
                          row.amount < 0 ? "text-red-600" : "text-gray-700"
                        }`}
                      >
                        {row.amount < 0 ? "-" : ""}${Math.abs(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <button className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors">
                Confirm
              </button>
              <button className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      <AddNewCardModal
        isOpen={isAddCardModalOpen}
        onClose={() => setIsAddCardModalOpen(false)}
        onAdd={handleAddCard}
      />
    </div>
  );
}
