"use client";

import { useState, useEffect } from "react";

type ImportItem = {
	id: string;
	cardId: string;
	cardName: string;
	owner: string;
	upload_date: string;
};

type DeleteTransactionsModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSuccess?: () => void;
};

export default function DeleteTransactionsModal({ isOpen, onClose, onSuccess }: DeleteTransactionsModalProps) {
	const [imports, setImports] = useState<ImportItem[]>([]);
	const [selectedImportIds, setSelectedImportIds] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(false);
	const [fetchError, setFetchError] = useState<string | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	useEffect(() => {
		if (isOpen) {
			setSelectedImportIds(new Set());
			setFetchError(null);
			setDeleteError(null);
			fetch("/api/imports")
				.then((r) => r.json())
				.then((data) => {
					if (data?.error) throw new Error(data.error);
					setImports(Array.isArray(data) ? data : []);
				})
				.catch((err) => setFetchError(err instanceof Error ? err.message : "Failed to load imports"));
		}
	}, [isOpen]);

	const toggleImport = (id: string) => {
		setSelectedImportIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const selectAll = () => {
		setSelectedImportIds(new Set(imports.map((i) => i.id).filter(Boolean)));
	};

	const selectNone = () => {
		setSelectedImportIds(new Set());
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedImportIds.size === 0) return;

		setLoading(true);
		setDeleteError(null);

		try {
			const res = await fetch("/api/transactions/by-import", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ importIds: Array.from(selectedImportIds) }),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to delete transactions");

			onSuccess?.();
			onClose();
		} catch (err) {
			setDeleteError(err instanceof Error ? err.message : "Failed to delete transactions");
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
			<div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
			<div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
				<h2 className="mb-6 text-xl font-bold text-gray-800">Delete Transactions by Import</h2>
				<p className="mb-4 text-sm text-gray-600">Select imports to delete all transactions and import records.</p>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<div className="mb-2 flex items-center justify-between">
							<label className="block text-sm font-medium text-gray-700">Imports</label>
							<div className="flex gap-2">
								<button type="button" onClick={selectAll} className="text-xs text-primary hover:underline">
									Select all
								</button>
								<button type="button" onClick={selectNone} className="text-xs text-gray-500 hover:underline">
									Clear
								</button>
							</div>
						</div>
						<div className="max-h-64 overflow-y-auto rounded-lg border border-gray-300 bg-white p-2">
							{imports.length === 0 && !fetchError ? (
								<p className="py-4 text-center text-sm text-amber-600">No imports found.</p>
							) : (
								imports.map((imp, index) => (
									<label
										key={`import-${String(imp.id)}-${index}`}
										className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 hover:bg-gray-50"
									>
										<input
											type="checkbox"
											name={`import-delete-${index}`}
											id={`import-delete-cb-${index}`}
											checked={!!imp.id && selectedImportIds.has(imp.id)}
											onChange={() => {
												if (imp.id) toggleImport(imp.id);
											}}
											className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
										/>
										<span className="text-sm text-gray-800">
											{imp.upload_date} – {imp.cardName}
											{imp.owner ? ` (${imp.owner})` : ""}
										</span>
									</label>
								))
							)}
						</div>
						{fetchError && <p className="mt-1 text-sm text-red-600">{fetchError}</p>}
					</div>

					{deleteError && <p className="text-sm text-red-600">{deleteError}</p>}

					<div className="flex justify-end gap-3 pt-4">
						<button
							type="button"
							onClick={onClose}
							disabled={loading}
							className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={selectedImportIds.size === 0 || loading || imports.length === 0}
							className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? "Deleting..." : `Delete (${selectedImportIds.size})`}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
