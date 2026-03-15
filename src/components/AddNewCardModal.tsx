"use client";

import { useState, useEffect } from "react";

const MOCK_OWNERS = ["Jon", "Yin"];

export type CardInput = {
  owner: string;
  cardName: string;
  dateHeader: string;
  descriptionHeader: string;
  debitHeader: string | null;
  creditHeader: string | null;
  singleColumn: boolean;
};

export type EditCardData = CardInput & { id: string };

type AddNewCardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (card: CardInput) => void;
  editCard?: EditCardData | null;
  onEdit?: (id: string, card: CardInput) => void;
};

const DEFAULT_HEADERS = {
  dateHeader: "Date",
  descriptionHeader: "Description",
  debitHeader: "Debit",
  creditHeader: "Credit",
};

export default function AddNewCardModal({
  isOpen,
  onClose,
  onAdd,
  editCard,
  onEdit,
}: AddNewCardModalProps) {
  const [singleColumn, setSingleColumn] = useState(editCard?.singleColumn ?? false);

  useEffect(() => {
    if (isOpen) setSingleColumn(editCard?.singleColumn ?? false);
  }, [isOpen, editCard?.singleColumn]);

  if (!isOpen) return null;

  const isEdit = !!editCard;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const owner = (form.elements.namedItem("owner") as HTMLSelectElement).value;
    const cardName = (form.elements.namedItem("cardName") as HTMLInputElement).value;
    const dateHeader = (form.elements.namedItem("dateHeader") as HTMLInputElement).value;
    const descriptionHeader = (form.elements.namedItem("descriptionHeader") as HTMLInputElement).value;
    const debitHeader = singleColumn ? null : (form.elements.namedItem("debitHeader") as HTMLInputElement)?.value ?? null;
    const creditHeader = singleColumn ? null : (form.elements.namedItem("creditHeader") as HTMLInputElement)?.value ?? null;

    if (owner && cardName && dateHeader && descriptionHeader && (!singleColumn ? debitHeader && creditHeader : true)) {
      const cardData = {
        owner,
        cardName,
        dateHeader,
        descriptionHeader,
        debitHeader,
        creditHeader,
        singleColumn,
      };
      if (isEdit && editCard) {
        onEdit?.(editCard.id, cardData);
      } else {
        onAdd?.(cardData);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          {isEdit ? "Edit Card" : "Add New Card"}
        </h2>
        <form key={editCard?.id ?? "add"} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="owner"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Select Owner
            </label>
            <select
              id="owner"
              name="owner"
              required
              defaultValue={editCard?.owner}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select Owner</option>
              {MOCK_OWNERS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="cardName"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Card Name
            </label>
            <input
              id="cardName"
              name="cardName"
              type="text"
              placeholder="e.g. Chase Reserve"
              required
              defaultValue={editCard?.cardName}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="border-t border-gray-200 pt-4">
            <p className="mb-3 text-sm font-medium text-gray-700">
              CSV Column Headers
            </p>
            <p className="mb-3 text-xs text-gray-500">
              Column names in your CSV file for parsing imports
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="singleColumn" className="text-sm text-gray-700">
                  Single column
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={singleColumn}
                  onClick={() => setSingleColumn((v) => !v)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    singleColumn ? "bg-primary" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                      singleColumn ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <input type="hidden" name="singleColumn" value={singleColumn ? "true" : "false"} />
              <div>
                <label htmlFor="dateHeader" className="mb-1 block text-xs text-gray-600">
                  Date
                </label>
                <input
                  id="dateHeader"
                  name="dateHeader"
                  type="text"
                  defaultValue={editCard?.dateHeader ?? DEFAULT_HEADERS.dateHeader}
                  required
                  placeholder="Date"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label htmlFor="descriptionHeader" className="mb-1 block text-xs text-gray-600">
                  Description
                </label>
                <input
                  id="descriptionHeader"
                  name="descriptionHeader"
                  type="text"
                  defaultValue={editCard?.descriptionHeader ?? DEFAULT_HEADERS.descriptionHeader}
                  required
                  placeholder="Description"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {!singleColumn && (
                <>
                  <div>
                    <label htmlFor="debitHeader" className="mb-1 block text-xs text-gray-600">
                      Debit
                    </label>
                    <input
                      id="debitHeader"
                      name="debitHeader"
                      type="text"
                      defaultValue={editCard?.debitHeader ?? DEFAULT_HEADERS.debitHeader}
                      required
                      placeholder="Debit"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label htmlFor="creditHeader" className="mb-1 block text-xs text-gray-600">
                      Credit
                    </label>
                    <input
                      id="creditHeader"
                      name="creditHeader"
                      type="text"
                      defaultValue={editCard?.creditHeader ?? DEFAULT_HEADERS.creditHeader}
                      required
                      placeholder="Credit"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
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
              {isEdit ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
