"use client";

import { useState, useCallback, useEffect } from "react";
import { formatCurrency } from "@/lib/currency";
import { parseCSVToTransactions, type ParsedTransaction, type CardConfig } from "@/lib/csv-import";

type Card = { id: string; name: string; owner: string; label: string };

export default function ImportsPage() {
	const [selectedCard, setSelectedCard] = useState("");
	const [cards, setCards] = useState<Card[]>([]);
	const [cardsLoading, setCardsLoading] = useState(true);
	const [isDragging, setIsDragging] = useState(false);
	const [previewData, setPreviewData] = useState<ParsedTransaction[] | null>(null);
	const [previewFilename, setPreviewFilename] = useState<string | null>(null);
	const [parseError, setParseError] = useState<string | null>(null);
	const [importing, setImporting] = useState(false);

	const fetchCards = useCallback(async () => {
		setCardsLoading(true);
		try {
			const res = await fetch("/api/cards");
			const data = await res.json();
			if (Array.isArray(data)) setCards(data);
		} catch {
			setCards([]);
		} finally {
			setCardsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchCards();
	}, [fetchCards]);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	}, []);

	const processFile = useCallback(
		async (file: File) => {
			setParseError(null);
			if (!file?.name.toLowerCase().endsWith(".csv")) {
				setParseError("Please drop a CSV file");
				return;
			}
			if (!selectedCard) {
				setParseError("Please select a card first");
				return;
			}
			try {
				const text = await file.text();
				const [cardRes, skipRes] = await Promise.all([fetch(`/api/cards/${selectedCard}`), fetch("/api/skip-keywords")]);
				const cardData = await cardRes.json();
				if (!cardRes.ok) throw new Error("Failed to load card config");
				const skipData = await skipRes.json();
				const skipKeywords: string[] = Array.isArray(skipData) ? skipData.map((r: { keyword: string }) => r.keyword) : [];

				const config: CardConfig = {
					dateHeader: cardData.dateHeader || "Date",
					descriptionHeader: cardData.descriptionHeader || "Description",
					debitHeader: cardData.debitHeader ?? null,
					creditHeader: cardData.creditHeader ?? null,
					singleColumn: cardData.singleColumn ?? false,
					singleColumnDebitFormat: cardData.singleColumnDebitFormat ?? null,
				};
				const parseResult = parseCSVToTransactions(text, config);
				if (!parseResult.ok) {
					setParseError(parseResult.error);
					setPreviewData(null);
					return;
				}
				const transactions = parseResult.transactions.filter((t) => {
					const desc = String(t.description ?? "").trim();
					if (desc === "") return false;
					return !skipKeywords.some((kw) => desc.toLowerCase().includes(kw.toLowerCase()));
				});
				if (transactions.length === 0) {
					setParseError("All rows were filtered out (empty descriptions or skip keywords).");
					setPreviewData(null);
				} else {
					setPreviewData(transactions);
					setPreviewFilename(file.name);
				}
			} catch (err) {
				setParseError(err instanceof Error ? err.message : "Failed to parse CSV");
				setPreviewData(null);
			}
		},
		[selectedCard],
	);

	const handleDrop = useCallback(
		async (e: React.DragEvent) => {
			e.preventDefault();
			setIsDragging(false);
			const file = e.dataTransfer.files[0];
			if (file) await processFile(file);
		},
		[processFile],
	);

	const handleFileInput = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) await processFile(file);
			e.target.value = "";
		},
		[processFile],
	);

	const handleConfirm = async () => {
		if (!previewData || !selectedCard || !previewFilename) return;
		setImporting(true);
		try {
			const res = await fetch("/api/imports", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					cardId: selectedCard,
					filename: previewFilename,
					transactions: previewData.map((t) => ({
						date: t.date,
						description: t.description,
						debit: t.debit,
						credit: t.credit,
					})),
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Import failed");
			setPreviewData(null);
			setPreviewFilename(null);
		} catch (err) {
			setParseError(err instanceof Error ? err.message : "Import failed");
		} finally {
			setImporting(false);
		}
	};

	const handleCancel = () => {
		setPreviewData(null);
		setPreviewFilename(null);
		setParseError(null);
	};

	const handleReset = () => {
		setSelectedCard("");
		setPreviewData(null);
		setPreviewFilename(null);
		setParseError(null);
	};

	return (
		<div className="mx-auto max-w-7xl px-6 py-8">
			<div className="mb-8 flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Importing</h1>
					<p className="mt-1 text-sm text-gray-500">Import CSV from cards</p>
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
					<label className="mb-2 block text-sm font-semibold text-gray-800">Select card</label>
					<select
						value={selectedCard}
						onChange={(e) => {
							setSelectedCard(e.target.value);
							setPreviewData(null);
							setParseError(null);
						}}
						disabled={cardsLoading}
						className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
					>
						<option value="">Select a card...</option>
						{cards.map((card) => (
							<option key={card.id} value={card.id}>
								{card.label}
							</option>
						))}
					</select>
				</div>

				<div className="mb-8">
					<label className="mb-2 block text-sm font-semibold text-gray-800">Import File here</label>
					<label
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
						className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors ${
							isDragging ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50 hover:border-gray-400"
						}`}
					>
						<input type="file" accept=".csv" onChange={handleFileInput} className="hidden" />
						{previewFilename ? (
							<>
								<p className="text-lg font-medium text-gray-700">{previewFilename}</p>
								<p className="text-sm text-gray-500">Drop another file to replace</p>
							</>
						) : (
							<>
								<p className="text-lg font-medium text-gray-500">Drag and drop file here</p>
								<p className="text-sm text-gray-400">or click to browse</p>
							</>
						)}
					</label>
					{parseError && <p className="mt-2 text-sm text-red-600">{parseError}</p>}
				</div>

				{previewData && previewData.length > 0 && (
					<>
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-lg font-semibold text-gray-800">Preview Transactions ({previewData.length} rows)</h2>
						</div>
						<div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
							<table className="w-full">
								<thead>
									<tr className="bg-gray-50">
										<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Debit</th>
										<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Credit</th>
									</tr>
								</thead>
								<tbody>
									{previewData.slice(0, 20).map((row, i) => (
										<tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
											<td className="px-4 py-3 text-sm text-gray-700">{row.date}</td>
											<td className="px-4 py-3 text-sm text-gray-700">{row.description}</td>
											<td className="px-4 py-3 text-sm font-medium text-gray-700">{row.debit > 0 ? formatCurrency(row.debit) : "—"}</td>
											<td className="px-4 py-3 text-sm font-medium text-gray-700">{row.credit > 0 ? formatCurrency(row.credit) : "—"}</td>
										</tr>
									))}
								</tbody>
							</table>
							{previewData.length > 20 && <p className="px-4 py-2 text-sm text-gray-500">Showing first 20 of {previewData.length} rows</p>}
						</div>
						<div className="flex gap-3">
							<button
								onClick={handleConfirm}
								disabled={importing}
								className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
							>
								{importing ? "Importing..." : "Confirm"}
							</button>
							<button
								onClick={handleCancel}
								disabled={importing}
								className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
							>
								Cancel
							</button>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
