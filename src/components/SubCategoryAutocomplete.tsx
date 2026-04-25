"use client";

import { useState, useEffect, useRef } from "react";
import { subCategoryNameTextClass } from "@/lib/subcategory-display";

export type SubCategory = { id: string; name: string; categoryId: string; categoryName: string | null };

type SubCategoryAutocompleteProps = {
	transactionId: string;
	value: string;
	subCategoryId: string | null;
	subCategories: SubCategory[];
	onUpdate: () => void;
};

export default function SubCategoryAutocomplete({ transactionId, value, subCategoryId, subCategories, onUpdate }: SubCategoryAutocompleteProps) {
	const [inputValue, setInputValue] = useState(value === "—" ? "" : value);
	const [showDropdown, setShowDropdown] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [loading, setLoading] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const listRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		setInputValue(value === "—" ? "" : value);
	}, [value]);

	const filtered = inputValue.trim() ? subCategories.filter((s) => s.name.toLowerCase().includes(inputValue.toLowerCase())) : subCategories;

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
				setShowDropdown(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Tab") {
			setShowDropdown(false);
			const inputs = document.querySelectorAll<HTMLInputElement>("[data-subcategory-input]");
			const current = e.currentTarget;
			const idx = Array.from(inputs).indexOf(current);
			if (idx >= 0) {
				const nextIdx = e.shiftKey ? idx - 1 : idx + 1;
				if (nextIdx >= 0 && nextIdx < inputs.length) {
					e.preventDefault();
					inputs[nextIdx].focus();
				}
			}
			return;
		}

		if (!showDropdown || filtered.length === 0) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlightedIndex((i) => (i < filtered.length - 1 ? i + 1 : 0));
			return;
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlightedIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
			return;
		}
		if (e.key === "Enter" && highlightedIndex >= 0 && highlightedIndex < filtered.length) {
			e.preventDefault();
			handleSelect(filtered[highlightedIndex]);
		}
	};

	useEffect(() => {
		if (showDropdown) setHighlightedIndex(filtered.length > 0 ? 0 : -1);
		else setHighlightedIndex(-1);
	}, [showDropdown, inputValue, filtered.length]);

	useEffect(() => {
		if (highlightedIndex >= 0 && listRef.current) {
			const item = listRef.current.children[highlightedIndex] as HTMLElement;
			item?.scrollIntoView({ block: "nearest" });
		}
	}, [highlightedIndex]);

	const handleSelect = async (sub: SubCategory) => {
		setInputValue(sub.name);
		setShowDropdown(false);
		setHighlightedIndex(-1);
		setLoading(true);
		try {
			const res = await fetch(`/api/transactions/${transactionId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subCategoryId: sub.id }),
			});
			if (!res.ok) throw new Error("Failed to update");
			onUpdate();
		} catch {
			setInputValue(value === "—" ? "" : value);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div ref={wrapperRef} className="relative min-w-[140px]">
			<input
				type="text"
				data-subcategory-input
				value={inputValue}
				onChange={(e) => {
					setInputValue(e.target.value);
					setShowDropdown(true);
				}}
				onKeyDown={handleKeyDown}
				placeholder="Type to search..."
				disabled={loading}
				className={`w-full rounded border border-gray-300 px-2 py-1.5 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 ${subCategoryNameTextClass(value, "text-gray-700")}`}
			/>
			{showDropdown && (
				<ul
					ref={listRef}
					className="absolute left-0 right-0 top-full z-50 mt-0.5 max-h-48 overflow-auto rounded border border-gray-200 bg-white py-1 shadow-lg"
				>
					{filtered.length === 0 ? (
						<li className="px-3 py-2 text-sm text-gray-500">No matches</li>
					) : (
						filtered.map((sub, i) => (
							<li key={sub.id}>
								<button
									type="button"
									onClick={() => handleSelect(sub)}
									className={`w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 ${i === highlightedIndex ? "bg-gray-100" : ""}`}
								>
									{sub.name}
								</button>
							</li>
						))
					)}
				</ul>
			)}
		</div>
	);
}
