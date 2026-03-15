"use client";

export type EditCategoryData = {
  id: string;
  name: string;
};

type AddCategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (name: string) => void;
  editCategory?: EditCategoryData | null;
  onEdit?: (id: string, name: string) => void;
};

export default function AddCategoryModal({
  isOpen,
  onClose,
  onAdd,
  editCategory,
  onEdit,
}: AddCategoryModalProps) {
  const isEdit = !!editCategory;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    if (name) {
      if (isEdit && editCategory) {
        onEdit?.(editCategory.id, name);
      } else {
        onAdd?.(name);
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
          {isEdit ? "Edit Category" : "Add Category"}
        </h2>
        <form key={editCategory?.id ?? "add"} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Category Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Fixed"
              required
              defaultValue={editCategory?.name}
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
