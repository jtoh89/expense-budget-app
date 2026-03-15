"use client";

type AddSkipKeywordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (keyword: string) => void;
  editKeyword?: string | null;
  onEdit?: (oldKeyword: string, newKeyword: string) => void;
};

export default function AddSkipKeywordModal({
  isOpen,
  onClose,
  onAdd,
  editKeyword,
  onEdit,
}: AddSkipKeywordModalProps) {
  const isEdit = !!editKeyword;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const keyword = (form.elements.namedItem("keyword") as HTMLInputElement).value.trim();
    if (keyword) {
      if (isEdit && editKeyword) {
        onEdit?.(editKeyword, keyword);
      } else {
        onAdd(keyword);
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
          {isEdit ? "Edit Skip Keyword" : "Add Skip Keyword"}
        </h2>
        <form
          key={editKeyword ?? "add"}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="keyword"
              className="mb-1 block text-xs text-gray-600"
            >
              Keyword
            </label>
            <input
              type="text"
              id="keyword"
              name="keyword"
              required
              defaultValue={editKeyword ?? ""}
              placeholder="e.g. PAYMENT THANK YOU"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-gray-500">
              Transactions whose description contains this keyword will be skipped during import.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              {isEdit ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
