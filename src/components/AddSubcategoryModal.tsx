"use client";

import { useState, useEffect } from "react";

type Category = { id: string; name: string };

export type EditSubcategoryData = {
  id: string;
  name: string;
  categoryId: string;
};

type AddSubcategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (categoryId: string, name: string) => void;
  editSubcategory?: EditSubcategoryData | null;
  onEdit?: (id: string, categoryId: string, name: string) => void;
};

export default function AddSubcategoryModal({
  isOpen,
  onClose,
  onAdd,
  editSubcategory,
  onEdit,
}: AddSubcategoryModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);

  const isEdit = !!editSubcategory;

  useEffect(() => {
    if (isOpen) {
      fetch("/api/categories")
        .then((res) => res.json())
        .then((data) => setCategories(Array.isArray(data) ? data : []))
        .catch(() => setCategories([]));
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const categoryId = (form.elements.namedItem("categoryId") as HTMLSelectElement).value;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    if (name && categoryId) {
      if (isEdit && editSubcategory) {
        onEdit?.(editSubcategory.id, categoryId, name.trim());
      } else {
        onAdd?.(categoryId, name.trim());
      }
      onClose();
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
          {isEdit ? "Edit Subcategory" : "Add Subcategory"}
        </h2>
        <form key={editSubcategory?.id ?? "add"} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="categoryId"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={editSubcategory?.categoryId}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Subcategory Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Groceries"
              required
              defaultValue={editSubcategory?.name}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-primary bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              {isEdit ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
