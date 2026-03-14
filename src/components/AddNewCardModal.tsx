"use client";

const MOCK_OWNERS = ["Jon", "Yin"];

type AddNewCardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (owner: string, cardName: string) => void;
};

export default function AddNewCardModal({
  isOpen,
  onClose,
  onAdd,
}: AddNewCardModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const owner = (form.elements.namedItem("owner") as HTMLSelectElement).value;
    const cardName = (form.elements.namedItem("cardName") as HTMLInputElement)
      .value;
    if (owner && cardName) {
      onAdd?.(owner, cardName);
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
        <h2 className="mb-6 text-xl font-bold text-gray-800">Add New Card</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select Owner</option>
              {MOCK_OWNERS.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
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
              placeholder="Card Name"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
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
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
