"use client";

import { useState, useEffect, useRef } from "react";
import { formatCurrency, formatCurrencyRounded, parseCurrencyInput } from "@/lib/currency";
import { subCategoryNameTextClass } from "@/lib/subcategory-display";
import AddBudgetItemModal from "@/components/AddBudgetItemModal";
import { Chart as ChartJS, ArcElement, CategoryScale, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, CategoryScale, Tooltip, Legend);

const CHART_COLORS = ["#10b981", "#7dd3fc", "#f97316", "#ef4444", "#a78bfa", "#1e40af", "#ec4899", "#14b8a6", "#eab308", "#6366f1"];

/** Display order for category ids (matches `categories.id` in DB seed). Unknown ids sort after these, by name. */
const BUDGET_CATEGORY_ORDER = ["Pretax", "Investments", "Future", "Fixed", "Flexible", "Luxury"];

type CategoryRow = {
	subcategoryId: string;
	expense: string;
	monthly: number;
	annual: number;
};

type BudgetSection = {
	name: string;
	rows: CategoryRow[];
};

type DbCategory = { id: string; name: string };

type SubcategoryMeta = { id: string; name: string; categoryId: string | null; categoryName: string | null };

type AllocationApiRow = {
	monthlyBudget: number;
	annualBudget: number | null;
};

function sortDbCategories(cats: DbCategory[]): DbCategory[] {
	return [...cats].sort((a, b) => {
		const ia = BUDGET_CATEGORY_ORDER.indexOf(a.id);
		const ib = BUDGET_CATEGORY_ORDER.indexOf(b.id);
		if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
		if (ia === -1) return 1;
		if (ib === -1) return -1;
		return ia - ib;
	});
}

function parseDbCategories(data: unknown): DbCategory[] {
	if (!Array.isArray(data)) return [];
	return data.filter(
		(c): c is DbCategory =>
			c !== null && typeof c === "object" && typeof (c as { id?: unknown }).id === "string" && typeof (c as { name?: unknown }).name === "string",
	);
}

function buildCategoryRowsFromDb(categories: DbCategory[], subs: SubcategoryMeta[], allocations: Record<string, AllocationApiRow>): BudgetSection[] {
	const subsByCatId = new Map<string, SubcategoryMeta[]>();
	for (const s of subs) {
		const key = s.categoryId ?? "";
		if (!key) continue;
		if (!subsByCatId.has(key)) subsByCatId.set(key, []);
		subsByCatId.get(key)!.push(s);
	}

	return sortDbCategories(categories).map((cat) => {
		const catSubs = subsByCatId.get(cat.id) ?? [];
		const rows: CategoryRow[] = catSubs.map((sub) => {
			const base: CategoryRow = {
				subcategoryId: sub.id,
				expense: sub.name,
				monthly: 0,
				annual: 0,
			};
			const alloc = allocationForSubcategory(allocations, sub.id);
			if (!alloc) return base;
			return {
				...base,
				monthly: alloc.monthlyBudget,
				annual: alloc.annualBudget ?? alloc.monthlyBudget * 12,
			};
		});
		return { name: cat.name, rows };
	});
}

function allocationForSubcategory(allocations: Record<string, AllocationApiRow>, subcategoryId: string): AllocationApiRow | undefined {
	if (allocations[subcategoryId]) return allocations[subcategoryId];
	const bare = subcategoryId.replace(/^sub_/, "");
	if (allocations[bare]) return allocations[bare];
	const withPrefix = `sub_${bare}`;
	if (allocations[withPrefix]) return allocations[withPrefix];
	return undefined;
}

function subcategoryIdsMatch(rowId: string, allocKey: string): boolean {
	const n = (s: string) => s.replace(/^sub_/, "");
	return rowId === allocKey || n(rowId) === n(allocKey);
}

function parseSubcategories(data: unknown): SubcategoryMeta[] {
	if (!Array.isArray(data)) return [];
	return data.filter(
		(s: unknown): s is SubcategoryMeta =>
			s !== null && typeof s === "object" && typeof (s as { id?: unknown }).id === "string" && typeof (s as { name?: unknown }).name === "string",
	);
}

export default function BudgetPage() {
	const [budgetYear, setBudgetYear] = useState("2026");
	const [annualIncome, setAnnualIncome] = useState(0);
	const [otherIncome, setOtherIncome] = useState(0);
	const [estimatedTaxes, setEstimatedTaxes] = useState(0);
	const [categoryRows, setCategoryRows] = useState<BudgetSection[]>([]);
	const [editingSections, setEditingSections] = useState<string[]>([]);
	const [sectionSnapshots, setSectionSnapshots] = useState<Record<string, CategoryRow[]>>({});
	const [addBudgetModalOpen, setAddBudgetModalOpen] = useState(false);
	const [newBudgetYear, setNewBudgetYear] = useState("2027");
	const [newBudgetOwner, setNewBudgetOwner] = useState("");
	const [copyFromYear, setCopyFromYear] = useState("2026");
	const [copyFromOwner, setCopyFromOwner] = useState("");
	const [createBudgetError, setCreateBudgetError] = useState<string | null>(null);
	const [createBudgetLoading, setCreateBudgetLoading] = useState(false);
	const [createModalOwners, setCreateModalOwners] = useState<string[]>([]);
	const [copyFromYears, setCopyFromYears] = useState<number[]>([]);
	const [editingIncome, setEditingIncome] = useState(false);
	const [incomeSnapshot, setIncomeSnapshot] = useState<{
		annualIncome: number;
		otherIncome: number;
		estimatedTaxes: number;
	} | null>(null);
	const [incomeLoading, setIncomeLoading] = useState(true);
	const [allocationsLoading, setAllocationsLoading] = useState(true);
	const [updatingSection, setUpdatingSection] = useState<string | null>(null);
	const [budgetYears, setBudgetYears] = useState<number[]>([]);
	const [selectedCategoriesForCategoryChart, setSelectedCategoriesForCategoryChart] = useState<string[]>([]);
	const [selectedCategoriesForSubChart, setSelectedCategoriesForSubChart] = useState<string[]>([]);
	const [categoryChartDropdownOpen, setCategoryChartDropdownOpen] = useState(false);
	const [subChartDropdownOpen, setSubChartDropdownOpen] = useState(false);
	const categoryChartDropdownRef = useRef<HTMLDivElement>(null);
	const subChartDropdownRef = useRef<HTMLDivElement>(null);
	const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
	const [owners, setOwners] = useState<string[]>([]);
	const [ownersDropdownOpen, setOwnersDropdownOpen] = useState(false);
	const ownersDropdownRef = useRef<HTMLDivElement>(null);
	const [deletePending, setDeletePending] = useState<{
		sectionName: string;
		rowIdx: number;
		row: CategoryRow;
	} | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [addItemModalSection, setAddItemModalSection] = useState<string | null>(null);
	const [deleteBudgetPending, setDeleteBudgetPending] = useState(false);
	const [deleteBudgetError, setDeleteBudgetError] = useState<string | null>(null);
	const [deleteModalOwner, setDeleteModalOwner] = useState("");
	const [deleteModalYear, setDeleteModalYear] = useState("");
	const [deleteModalOwners, setDeleteModalOwners] = useState<string[]>([]);
	const [deleteModalYears, setDeleteModalYears] = useState<number[]>([]);

	useEffect(() => {
		Promise.all([fetch("/api/budgets?owners=true").then((r) => r.json()), fetch("/api/cards").then((r) => r.json())])
			.then(([budgetOwners, cards]) => {
				const fromBudgets = Array.isArray(budgetOwners) ? budgetOwners.filter((o): o is string => typeof o === "string") : [];
				const fromCards = Array.isArray(cards) ? ([...new Set(cards.map((c: { owner?: string }) => c.owner).filter(Boolean))] as string[]) : [];
				const list = [...new Set([...fromBudgets, ...fromCards])].sort();
				setOwners(list);
				setSelectedOwner((prev) => (prev && list.includes(prev) ? prev : (list[0] ?? null)));
			})
			.catch(() => {
				setOwners([]);
			});
	}, []);

	useEffect(() => {
		if (addBudgetModalOpen) {
			setCreateBudgetError(null);
			setCopyFromOwner("");
			setCopyFromYear("");
			setCopyFromYears([]);
			setNewBudgetYear(String(parseInt(budgetYear, 10) + 1));
			const currentOwner = selectedOwner ?? owners[0] ?? "";
			Promise.all([fetch("/api/budgets?owners=true").then((r) => r.json()), fetch("/api/cards").then((r) => r.json())]).then(
				([budgetOwners, cards]) => {
					const fromBudgets = Array.isArray(budgetOwners) ? budgetOwners.filter((o) => typeof o === "string") : [];
					const fromCards = Array.isArray(cards) ? ([...new Set(cards.map((c: { owner?: string }) => c.owner).filter(Boolean))] as string[]) : [];
					const list = [...new Set([...fromBudgets, ...fromCards])].sort();
					setCreateModalOwners(list);
					setNewBudgetOwner(list.includes(currentOwner) ? currentOwner : (list[0] ?? ""));
				},
			);
		}
	}, [addBudgetModalOpen, budgetYear, selectedOwner, owners]);

	useEffect(() => {
		if (addBudgetModalOpen && copyFromOwner) {
			const ownerParam = `?owner=${encodeURIComponent(copyFromOwner)}`;
			fetch(`/api/budgets${ownerParam}`)
				.then((r) => r.json())
				.then((years: number[]) => {
					setCopyFromYears(Array.isArray(years) ? years : []);
					setCopyFromYear("");
				});
		} else {
			setCopyFromYears([]);
			setCopyFromYear("");
		}
	}, [addBudgetModalOpen, copyFromOwner]);

	useEffect(() => {
		if (deleteBudgetPending) {
			setDeleteBudgetError(null);
			setDeleteModalOwner("");
			setDeleteModalYear("");
			setDeleteModalOwners([]);
			setDeleteModalYears([]);
			fetch("/api/budgets?owners=true")
				.then((r) => r.json())
				.then((data) => {
					const list = Array.isArray(data) ? data.filter((o): o is string => typeof o === "string") : [];
					setDeleteModalOwners(list);
				});
		}
	}, [deleteBudgetPending]);

	useEffect(() => {
		if (deleteBudgetPending && deleteModalOwner) {
			const ownerParam = `?owner=${encodeURIComponent(deleteModalOwner)}`;
			fetch(`/api/budgets${ownerParam}`)
				.then((r) => r.json())
				.then((years: number[]) => {
					setDeleteModalYears(Array.isArray(years) ? years : []);
					setDeleteModalYear("");
				});
		} else {
			setDeleteModalYears([]);
			setDeleteModalYear("");
		}
	}, [deleteBudgetPending, deleteModalOwner]);

	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (categoryChartDropdownRef.current && !categoryChartDropdownRef.current.contains(e.target as Node)) {
				setCategoryChartDropdownOpen(false);
			}
			if (subChartDropdownRef.current && !subChartDropdownRef.current.contains(e.target as Node)) {
				setSubChartDropdownOpen(false);
			}
			if (ownersDropdownRef.current && !ownersDropdownRef.current.contains(e.target as Node)) {
				setOwnersDropdownOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const budgetOwner = selectedOwner ?? owners[0] ?? "";
	const fmt = (n: number) => (budgetOwner ? formatCurrencyRounded(n) : "—");

	useEffect(() => {
		setEditingSections([]);
		setSectionSnapshots({});
		setEditingIncome(false);
		setIncomeSnapshot(null);
	}, [budgetYear, budgetOwner]);

	useEffect(() => {
		let cancelled = false;
		const ownerParam = budgetOwner ? `?owner=${encodeURIComponent(budgetOwner)}` : "";
		fetch(`/api/budgets${ownerParam}`)
			.then((res) => res.json())
			.then((years: number[]) => {
				if (cancelled || !Array.isArray(years)) return;
				setBudgetYears(years);
				setBudgetYear((prev) => {
					const prevNum = parseInt(prev, 10);
					if (years.length > 0 && !years.includes(prevNum)) {
						return String(years[0]);
					}
					return prev;
				});
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [budgetOwner]);

	useEffect(() => {
		let cancelled = false;
		if (!budgetOwner) {
			setAnnualIncome(0);
			setOtherIncome(0);
			setEstimatedTaxes(0);
			setIncomeLoading(false);
			return () => {
				cancelled = true;
			};
		}
		setIncomeLoading(true);
		const ownerParam = `?owner=${encodeURIComponent(budgetOwner)}`;
		fetch(`/api/budgets/${budgetYear}${ownerParam}`)
			.then((res) => res.json())
			.then((data: unknown) => {
				if (cancelled) return;
				if (data && typeof data === "object" && data !== null && "error" in data) {
					setAnnualIncome(0);
					setOtherIncome(0);
					setEstimatedTaxes(0);
					return;
				}
				if (data && typeof data === "object" && data !== null && typeof (data as { annualIncome?: unknown }).annualIncome === "number") {
					const d = data as { annualIncome: number; otherIncome: number; estimatedTaxes: number };
					setAnnualIncome(d.annualIncome);
					setOtherIncome(typeof d.otherIncome === "number" ? d.otherIncome : 0);
					setEstimatedTaxes(typeof d.estimatedTaxes === "number" ? d.estimatedTaxes : 0);
				} else {
					setAnnualIncome(0);
					setOtherIncome(0);
					setEstimatedTaxes(0);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setAnnualIncome(0);
					setOtherIncome(0);
					setEstimatedTaxes(0);
				}
			})
			.finally(() => {
				if (!cancelled) setIncomeLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [budgetYear, budgetOwner]);

	useEffect(() => {
		let cancelled = false;
		setAllocationsLoading(true);
		const ownerQ = budgetOwner ? encodeURIComponent(budgetOwner) : "";

		const loadAllocJson = () =>
			budgetOwner ? fetch(`/api/budget-allocations?year=${budgetYear}&owner=${ownerQ}`).then((r) => r.json()) : Promise.resolve({});

		Promise.all([fetch("/api/categories").then((r) => r.json()), fetch("/api/subcategories").then((r) => r.json()), loadAllocJson()])
			.then(([catData, subData, allocData]) => {
				if (cancelled) return;
				const categories = parseDbCategories(catData);
				const subs = parseSubcategories(subData);
				if (allocData && typeof allocData === "object" && allocData !== null && "error" in allocData) {
					setCategoryRows(buildCategoryRowsFromDb(categories, subs, {}));
					return;
				}
				const allocations =
					allocData && typeof allocData === "object" && !Array.isArray(allocData) ? (allocData as Record<string, AllocationApiRow>) : {};

				let base = buildCategoryRowsFromDb(categories, subs, allocations);

				const orphanKeys = Object.keys(allocations).filter((ak) => {
					const row = allocations[ak];
					if (row == null || typeof row !== "object" || typeof row.monthlyBudget !== "number") return false;
					return !base.some((s) => s.rows.some((r) => subcategoryIdsMatch(r.subcategoryId, ak)));
				});

				for (const ak of orphanKeys) {
					const alloc = allocations[ak];
					if (alloc == null || typeof alloc.monthlyBudget !== "number") continue;
					const sub = subs.find((s) => subcategoryIdsMatch(s.id, ak));
					if (!sub?.categoryName) continue;
					const newRow: CategoryRow = {
						subcategoryId: sub.id,
						expense: sub.name,
						monthly: alloc.monthlyBudget,
						annual: alloc.annualBudget ?? alloc.monthlyBudget * 12,
					};
					const si = base.findIndex((s) => s.name === sub.categoryName);
					if (si >= 0) {
						base = base.map((s, i) => (i === si ? { ...s, rows: [...s.rows, newRow] } : s));
					}
				}

				setCategoryRows(base);
			})
			.catch(() => {
				if (!cancelled) setCategoryRows([]);
			})
			.finally(() => {
				if (!cancelled) setAllocationsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [budgetYear, budgetOwner]);

	const getSectionTotals = (rows: CategoryRow[]) => {
		return rows.reduce(
			(acc, row) => ({
				monthly: acc.monthly + row.monthly,
				annual: acc.annual + row.annual,
			}),
			{ monthly: 0, annual: 0 },
		);
	};

	const categoryChartItems = categoryRows
		.filter((s) => selectedCategoriesForCategoryChart.length === 0 || selectedCategoriesForCategoryChart.includes(s.name))
		.map((s, i) => ({
			name: s.name,
			value: getSectionTotals(s.rows).annual,
			color: CHART_COLORS[i % CHART_COLORS.length],
		}))
		.filter((item) => item.value > 0);

	const categoryChartData = {
		labels: categoryChartItems.map((c) => c.name),
		datasets: [
			{
				data: categoryChartItems.map((c) => c.value),
				backgroundColor: categoryChartItems.map((c) => c.color),
				borderWidth: 0,
			},
		],
	};

	const subcategoryRowsForChart = (
		selectedCategoriesForSubChart.length > 0 ? categoryRows.filter((s) => selectedCategoriesForSubChart.includes(s.name)) : categoryRows
	).flatMap((s) => s.rows);

	const subcategoryChartItems = subcategoryRowsForChart
		.map((r, i) => ({
			row: r,
			annual: r.annual,
			color: CHART_COLORS[i % CHART_COLORS.length],
		}))
		.filter((item) => item.annual > 0);

	const subcategoryChartData = {
		labels: subcategoryChartItems.map((c) => c.row.expense),
		datasets: [
			{
				data: subcategoryChartItems.map((c) => c.annual),
				backgroundColor: subcategoryChartItems.map((c) => c.color),
				borderWidth: 0,
			},
		],
	};

	const pieOptions = {
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			legend: {
				display: false,
			},
		},
	};

	const updateCategoryRow = (sectionName: string, rowIdx: number, field: "monthly" | "annual", value: number) => {
		setCategoryRows((prev) =>
			prev.map((s) =>
				s.name === sectionName
					? {
							...s,
							rows: s.rows.map((r, i) => {
								if (i !== rowIdx) return r;
								const monthly = field === "monthly" ? value : Math.round((value / 12) * 100) / 100;
								const annual = field === "annual" ? value : Math.round(value * 12);
								return { ...r, monthly, annual };
							}),
						}
					: s,
			),
		);
	};

	const openDeleteModal = (sectionName: string, rowIdx: number, row: CategoryRow) => {
		setDeletePending({ sectionName, rowIdx, row });
		setDeleteError(null);
	};

	const closeDeleteModal = () => {
		setDeletePending(null);
		setDeleteError(null);
	};

	const confirmDeleteBudgetItem = async () => {
		if (!deletePending) return;
		const { sectionName, rowIdx, row } = deletePending;
		setDeleteError(null);

		try {
			const checkRes = await fetch(
				`/api/transactions/has-for-subcategory?subcategoryId=${encodeURIComponent(row.subcategoryId)}&year=${budgetYear}&owner=${encodeURIComponent(budgetOwner)}`,
			);
			const checkData = await checkRes.json();
			if (!checkRes.ok) throw new Error(checkData.error || "Failed to check transactions");

			if (checkData.hasTransactions) {
				setDeleteError(
					"Cannot delete: there are existing transactions for this subcategory, year, and owner. Remove or reassign those transactions first.",
				);
				return;
			}

			if (!row.subcategoryId.startsWith("new_")) {
				const deleteRes = await fetch("/api/budget-allocations", {
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						subcategoryId: row.subcategoryId,
						year: parseInt(budgetYear, 10),
						owner: budgetOwner,
					}),
				});
				if (!deleteRes.ok) {
					const err = await deleteRes.json().catch(() => ({}));
					throw new Error(err.error || "Failed to delete");
				}
			}

			setCategoryRows((prev) => prev.map((s) => (s.name === sectionName ? { ...s, rows: s.rows.filter((_, i) => i !== rowIdx) } : s)));
			closeDeleteModal();
		} catch (err) {
			setDeleteError(err instanceof Error ? err.message : "Failed to delete");
		}
	};

	const addCategoryRow = (sectionName: string, row: CategoryRow) => {
		setCategoryRows((prev) => prev.map((s) => (s.name === sectionName ? { ...s, rows: [...s.rows, row] } : s)));
	};

	const enterEditMode = (sectionName: string) => {
		const section = categoryRows.find((s) => s.name === sectionName);
		if (!section || editingSections.includes(sectionName)) return;
		setSectionSnapshots((prev) => ({
			...prev,
			[sectionName]: section.rows.map((r) => ({ ...r })),
		}));
		setEditingSections((prev) => [...prev, sectionName]);
	};

	const handleUpdate = async (sectionName: string) => {
		setUpdatingSection(sectionName);
		try {
			const section = categoryRows.find((s) => s.name === sectionName);
			if (section) {
				const yearNum = parseInt(budgetYear, 10);
				for (const row of section.rows) {
					try {
						const res = await fetch("/api/budget-allocations", {
							method: "PATCH",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								subcategoryId: row.subcategoryId,
								year: yearNum,
								owner: budgetOwner,
								monthlyBudget: row.monthly,
								annualBudget: row.annual,
							}),
						});
						if (!res.ok) {
							const err = await res.json().catch(() => ({}));
							console.error("Budget allocation PATCH failed:", row.subcategoryId, res.status, err);
						}
					} catch (err) {
						console.error("Budget allocation PATCH error:", row.subcategoryId, err);
					}
				}
			}
			setEditingSections((prev) => prev.filter((n) => n !== sectionName));
			setSectionSnapshots((prev) => {
				const next = { ...prev };
				delete next[sectionName];
				return next;
			});
		} finally {
			setUpdatingSection(null);
		}
	};

	const handleCancel = (sectionName: string) => {
		const snapshot = sectionSnapshots[sectionName];
		if (snapshot) {
			setCategoryRows((prev) => prev.map((s) => (s.name === sectionName ? { ...s, rows: snapshot } : s)));
		}
		setEditingSections((prev) => prev.filter((n) => n !== sectionName));
		setSectionSnapshots((prev) => {
			const next = { ...prev };
			delete next[sectionName];
			return next;
		});
	};

	const enterIncomeEditMode = () => {
		if (editingIncome) return;
		setIncomeSnapshot({
			annualIncome,
			otherIncome,
			estimatedTaxes,
		});
		setEditingIncome(true);
	};

	const handleIncomeUpdate = async () => {
		try {
			const res = await fetch(`/api/budgets/${budgetYear}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					owner: budgetOwner,
					annualIncome,
					otherIncome,
					estimatedTaxes,
				}),
			});
			if (!res.ok) throw new Error("Failed to save");
		} catch {
			// TODO: show error toast
		} finally {
			setEditingIncome(false);
			setIncomeSnapshot(null);
		}
	};

	const handleIncomeCancel = () => {
		if (incomeSnapshot) {
			setAnnualIncome(incomeSnapshot.annualIncome);
			setOtherIncome(incomeSnapshot.otherIncome);
			setEstimatedTaxes(incomeSnapshot.estimatedTaxes);
		}
		setEditingIncome(false);
		setIncomeSnapshot(null);
	};

	const pretaxSection = categoryRows.find((s) => s.name === "Pretax");
	const pretaxTotals = pretaxSection ? getSectionTotals(pretaxSection.rows) : { monthly: 0, annual: 0 };
	const adjustedGrossIncome = Math.max(0, annualIncome + otherIncome - pretaxTotals.annual);
	const takeHomePay = Math.max(0, adjustedGrossIncome - estimatedTaxes);

	return (
		<div className="mx-auto max-w-7xl px-6 py-8">
			{/* Budget Planner */}
			<div className="mb-10">
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<h1 className="text-2xl font-bold text-gray-800">{budgetYear} Budget Planner</h1>
					<div className="flex items-end gap-2">
						<div>
							<label className="mb-2 block text-sm font-medium text-gray-700">Budget Year</label>
							<select
								value={budgetYear}
								onChange={(e) => setBudgetYear(e.target.value)}
								className="w-full min-w-[120px] rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							>
								{budgetYears.length > 0 ? (
									budgetYears.map((y) => (
										<option key={y} value={String(y)}>
											{y}
										</option>
									))
								) : (
									<option value={budgetYear}>{budgetYear}</option>
								)}
							</select>
						</div>
						<div className="relative" ref={ownersDropdownRef}>
							<label className="mb-2 block text-sm font-medium text-gray-700">Owner</label>
							<button
								type="button"
								aria-haspopup="listbox"
								aria-expanded={ownersDropdownOpen}
								onClick={() => setOwnersDropdownOpen((o) => !o)}
								className="flex min-w-[140px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-gray-800 shadow-sm hover:bg-gray-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
							>
								<span className="truncate">{budgetOwner || "—"}</span>
								<svg
									className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${ownersDropdownOpen ? "rotate-180" : ""}`}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							{ownersDropdownOpen && (
								<div
									className="absolute left-0 top-full z-20 mt-1 max-h-60 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
									role="listbox"
								>
									{owners.length === 0 ? (
										<p className="px-4 py-2 text-sm text-gray-500">No users yet — add a card with an owner first.</p>
									) : (
										owners.map((owner) => (
											<button
												key={owner}
												type="button"
												role="option"
												aria-selected={budgetOwner === owner}
												onClick={() => {
													setSelectedOwner(owner);
													setOwnersDropdownOpen(false);
												}}
												className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left hover:bg-gray-50"
											>
												<span
													className={`h-4 w-4 shrink-0 rounded-full border-2 ${budgetOwner === owner ? "border-primary bg-primary" : "border-gray-300"}`}
												/>
												<span className="text-sm text-gray-700">{owner}</span>
											</button>
										))
									)}
								</div>
							)}
						</div>
						<button
							type="button"
							onClick={() => setAddBudgetModalOpen(true)}
							className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-hover"
							aria-label="Add"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="12" y1="5" x2="12" y2="19" />
								<line x1="5" y1="12" x2="19" y2="12" />
							</svg>
						</button>
						<button
							type="button"
							onClick={() => setDeleteBudgetPending(true)}
							className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-lg bg-red-600 text-white transition-colors hover:bg-red-700"
							aria-label="Delete budget"
						>
							<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</div>
				</div>

				<div className="mb-8">
					<div className="mb-4 flex items-center gap-2">
						<h3 className="text-xl font-bold text-gray-800">Income</h3>
						<button
							type="button"
							onClick={enterIncomeEditMode}
							disabled={incomeLoading}
							className={`text-sm text-blue-600 underline hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${editingIncome ? "font-medium" : ""}`}
						>
							{editingIncome ? "Editing" : "Edit"}
						</button>
					</div>
					<div className="flex max-w-md flex-col gap-6">
						<div>
							<label className="mb-2 block text-sm font-medium text-gray-700">Annual Income</label>
							{editingIncome ? (
								<input
									type="text"
									inputMode="numeric"
									value={annualIncome === 0 ? "" : formatCurrencyRounded(annualIncome)}
									onChange={(e) => setAnnualIncome(parseCurrencyInput(e.target.value))}
									placeholder="$0"
									className="w-36 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							) : (
								<p className="py-2.5 text-base font-medium text-gray-800">{fmt(annualIncome)}</p>
							)}
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium text-gray-700">Other Income</label>
							{editingIncome ? (
								<input
									type="text"
									inputMode="numeric"
									value={otherIncome === 0 ? "" : formatCurrencyRounded(otherIncome)}
									onChange={(e) => setOtherIncome(parseCurrencyInput(e.target.value))}
									placeholder="$0"
									className="w-36 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							) : (
								<p className="py-2.5 text-base font-medium text-gray-800">{fmt(otherIncome)}</p>
							)}
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium text-gray-700">
								Estimated Taxes{" "}
								<a
									href={`https://www.talent.com/tax-calculator?salary=${annualIncome + otherIncome}&from=year&region=California`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-blue-600 cursor-pointer hover:underline"
								>
									Use link
								</a>
							</label>
							{editingIncome ? (
								<input
									type="text"
									inputMode="numeric"
									value={estimatedTaxes === 0 ? "" : formatCurrencyRounded(estimatedTaxes)}
									onChange={(e) => setEstimatedTaxes(parseCurrencyInput(e.target.value))}
									placeholder="$0"
									className="w-36 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								/>
							) : (
								<p className="py-2.5 text-base font-medium text-gray-800">{fmt(estimatedTaxes)}</p>
							)}
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium text-gray-700">Adjusted Gross Income</label>
							<p className="py-2.5 text-base font-medium text-gray-800">{fmt(adjustedGrossIncome)}</p>
						</div>
						<div>
							<label className="mb-2 block text-sm font-medium text-gray-700">Take Home Pay</label>
							<p className="py-2.5 text-base font-medium text-gray-800">{fmt(takeHomePay)}</p>
						</div>
						{editingIncome && (
							<div className="flex justify-center gap-3 pt-2">
								<button
									type="button"
									onClick={handleIncomeCancel}
									className="rounded-lg border border-primary bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={handleIncomeUpdate}
									className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
								>
									Update
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Budget Categories */}
				<h2 className="mb-6 text-xl font-bold text-gray-800">Budget Categories</h2>
				{/* Category Budget Allocation */}
				<div className="mb-10">
					<div className="rounded-xl bg-white p-6 shadow-sm">
						<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
							<h3 className="text-xl font-bold text-gray-800">Category Budget Allocation</h3>
							<div className="relative" ref={categoryChartDropdownRef}>
								<button
									type="button"
									onClick={() => setCategoryChartDropdownOpen((o) => !o)}
									className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-w-[180px]"
								>
									<span className="truncate">
										{selectedCategoriesForCategoryChart.length === 0 ? "All Categories" : `${selectedCategoriesForCategoryChart.length} selected`}
									</span>
									<svg
										className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${categoryChartDropdownOpen ? "rotate-180" : ""}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
								</button>
								{categoryChartDropdownOpen && (
									<div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
										{categoryRows.map((s) => (
											<label key={s.name} className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-50">
												<input
													type="checkbox"
													checked={selectedCategoriesForCategoryChart.length === 0 || selectedCategoriesForCategoryChart.includes(s.name)}
													onChange={() => {
														setSelectedCategoriesForCategoryChart((prev) => {
															const allNames = categoryRows.map((x) => x.name);
															const next =
																prev.length === 0
																	? allNames.filter((n) => n !== s.name)
																	: prev.includes(s.name)
																		? prev.filter((n) => n !== s.name)
																		: [...prev, s.name];
															return next.length === allNames.length ? [] : next;
														});
													}}
													className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
												/>
												<span className="text-sm text-gray-700">{s.name}</span>
											</label>
										))}
									</div>
								)}
							</div>
						</div>
						<div className="flex gap-6">
							<div className="h-64 w-64 shrink-0 flex items-center justify-center">
								{categoryChartItems.length > 0 ? (
									<Doughnut data={categoryChartData} options={pieOptions} />
								) : (
									<p className="text-sm text-gray-500">No budget data</p>
								)}
							</div>
							<div className="flex flex-col justify-center gap-2 max-h-64 overflow-y-auto">
								{categoryChartItems.map((c) => (
									<div key={c.name} className="flex items-center gap-2">
										<div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
										<span className="text-sm text-gray-700 truncate">{c.name}</span>
										<span className="text-sm text-gray-500 ml-auto shrink-0">{fmt(c.value)}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Sub Category Budget Allocation */}
				<div className="mb-10">
					<div className="rounded-xl bg-white p-6 shadow-sm">
						<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
							<h3 className="text-xl font-bold text-gray-800">Sub Category Budget Allocation</h3>
							<div className="relative" ref={subChartDropdownRef}>
								<button
									type="button"
									onClick={() => setSubChartDropdownOpen((o) => !o)}
									className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-w-[180px]"
								>
									<span className="truncate">
										{selectedCategoriesForSubChart.length === 0 ? "All Categories" : `${selectedCategoriesForSubChart.length} selected`}
									</span>
									<svg
										className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${subChartDropdownOpen ? "rotate-180" : ""}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
								</button>
								{subChartDropdownOpen && (
									<div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
										{categoryRows.map((s) => (
											<label key={s.name} className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-50">
												<input
													type="checkbox"
													checked={selectedCategoriesForSubChart.length === 0 || selectedCategoriesForSubChart.includes(s.name)}
													onChange={() => {
														setSelectedCategoriesForSubChart((prev) => {
															const allNames = categoryRows.map((x) => x.name);
															const next =
																prev.length === 0
																	? allNames.filter((n) => n !== s.name)
																	: prev.includes(s.name)
																		? prev.filter((n) => n !== s.name)
																		: [...prev, s.name];
															return next.length === allNames.length ? [] : next;
														});
													}}
													className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
												/>
												<span className="text-sm text-gray-700">{s.name}</span>
											</label>
										))}
									</div>
								)}
							</div>
						</div>
						<div className="flex gap-6">
							<div className="h-64 w-64 shrink-0 flex items-center justify-center">
								{subcategoryChartItems.length > 0 ? (
									<Doughnut data={subcategoryChartData} options={pieOptions} />
								) : (
									<p className="text-sm text-gray-500">No budget data</p>
								)}
							</div>
							<div className="flex flex-col justify-center gap-2 max-h-64 overflow-y-auto min-w-0">
								{subcategoryChartItems.map((item) => (
									<div key={item.row.subcategoryId} className="flex items-center gap-2">
										<div className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
										<span className={`text-sm truncate ${subCategoryNameTextClass(item.row.expense)}`}>{item.row.expense}</span>
										<span className="text-sm text-gray-500 ml-auto shrink-0">{fmt(item.annual)}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Budget Expenses */}
				<h2 className="mb-6 text-xl font-bold text-gray-800">Budget Expenses</h2>

				{categoryRows.map((section, sectionIdx) => {
					const totals = getSectionTotals(section.rows);
					return (
						<div key={section.name} className={sectionIdx < categoryRows.length - 1 ? "mb-10" : ""}>
							<div className="mb-4 flex items-center gap-2">
								<h3 className="text-xl font-bold text-gray-800">{section.name}</h3>
								<button
									type="button"
									onClick={() => enterEditMode(section.name)}
									className={`text-sm text-blue-600 underline hover:text-blue-700 ${editingSections.includes(section.name) ? "font-medium" : ""}`}
								>
									{editingSections.includes(section.name) ? "Editing" : "Edit"}
								</button>
							</div>
							<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
								<table className="w-full">
									<thead>
										<tr className="bg-gray-50">
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Expense</th>
											<th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Monthly</th>
											<th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Annual</th>
											{editingSections.includes(section.name) && <th className="w-12 px-2 py-3" aria-label="Actions" />}
										</tr>
									</thead>
									<tbody>
										{section.rows.map((row, i) => {
											const isEditing = editingSections.includes(section.name);
											return (
												<tr key={i} className={`border-t border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
													<td className="px-4 py-3">
														<span className={`block px-3 py-2 text-sm ${subCategoryNameTextClass(row.expense, "text-gray-800")}`}>{row.expense}</span>
													</td>
													<td className="px-4 py-3 text-right tabular-nums">
														{isEditing ? (
															<input
																type="text"
																inputMode="numeric"
																value={formatCurrencyRounded(row.monthly)}
																onChange={(e) => updateCategoryRow(section.name, i, "monthly", parseCurrencyInput(e.target.value))}
																className="w-28 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-right text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
															/>
														) : (
															<span className="block text-sm text-gray-800">{fmt(row.monthly)}</span>
														)}
													</td>
													<td className="px-4 py-3 text-right tabular-nums">
														{isEditing ? (
															<input
																type="text"
																inputMode="numeric"
																value={formatCurrencyRounded(row.annual)}
																onChange={(e) => updateCategoryRow(section.name, i, "annual", parseCurrencyInput(e.target.value))}
																className="w-28 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-right text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
															/>
														) : (
															<span className="block text-sm text-gray-800">{fmt(row.annual)}</span>
														)}
													</td>
													{isEditing && (
														<td className="px-2 py-3 text-right">
															<button
																type="button"
																onClick={() => openDeleteModal(section.name, i, row)}
																className="inline-flex items-center justify-center rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
																aria-label="Delete row"
															>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	width="18"
																	height="18"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	strokeWidth="2"
																	strokeLinecap="round"
																	strokeLinejoin="round"
																>
																	<polyline points="3 6 5 6 21 6" />
																	<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
																	<line x1="10" y1="11" x2="10" y2="17" />
																	<line x1="14" y1="11" x2="14" y2="17" />
																</svg>
															</button>
														</td>
													)}
												</tr>
											);
										})}
										{editingSections.includes(section.name) && (
											<tr className="border-t border-gray-200">
												<td colSpan={4} className="px-4 py-3">
													<button
														type="button"
														onClick={() => setAddItemModalSection(section.name)}
														className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-hover mx-auto"
														aria-label="Add row"
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															width="20"
															height="20"
															viewBox="0 0 24 24"
															fill="none"
															stroke="currentColor"
															strokeWidth="2"
															strokeLinecap="round"
															strokeLinejoin="round"
														>
															<line x1="12" y1="5" x2="12" y2="19" />
															<line x1="5" y1="12" x2="19" y2="12" />
														</svg>
													</button>
												</td>
											</tr>
										)}
									</tbody>
									<tfoot>
										<tr className="border-t border-gray-200 bg-gray-50 font-semibold">
											<td className="px-4 py-3 text-sm text-gray-800">TOTAL:</td>
											<td className="px-4 py-3 text-right text-sm tabular-nums text-gray-800">{fmt(totals.monthly)}</td>
											<td className="px-4 py-3 text-right text-sm tabular-nums text-gray-800">{fmt(totals.annual)}</td>
											{editingSections.includes(section.name) && <td className="w-12 px-2 py-3" />}
										</tr>
									</tfoot>
								</table>
							</div>
							{editingSections.includes(section.name) && (
								<div className="mt-4 flex justify-center gap-3">
									<button
										type="button"
										onClick={() => handleCancel(section.name)}
										disabled={updatingSection === section.name}
										className="rounded-lg border border-primary bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
									>
										Cancel
									</button>
									<button
										type="button"
										onClick={() => handleUpdate(section.name)}
										disabled={updatingSection === section.name}
										className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
									>
										{updatingSection === section.name ? "Updating..." : "Update"}
									</button>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Add Budget Item Modal */}
			{addItemModalSection && (
				<AddBudgetItemModal
					isOpen={!!addItemModalSection}
					onClose={() => setAddItemModalSection(null)}
					onAdd={(row) => {
						addCategoryRow(addItemModalSection, row);
						setAddItemModalSection(null);
					}}
					sectionName={addItemModalSection}
					existingSubcategoryIds={categoryRows.find((s) => s.name === addItemModalSection)?.rows.map((r) => r.subcategoryId) ?? []}
				/>
			)}

			{/* Delete Budget Item Modal */}
			{deletePending && (
				<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
					<div className="absolute inset-0 bg-black/50" onClick={closeDeleteModal} aria-hidden="true" />
					<div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
						<h2 className="mb-4 text-xl font-bold text-gray-900">Delete Budget Item?</h2>
						<p className="mb-2 text-sm text-gray-600">Are you sure you want to delete &quot;{deletePending.row.expense}&quot;?</p>
						<p className="mb-6 text-sm text-gray-600">This action cannot be undone.</p>
						{deleteError && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{deleteError}</p>}
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={closeDeleteModal}
								className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={confirmDeleteBudgetItem}
								className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Delete Budget Confirmation Modal */}
			{deleteBudgetPending && (
				<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
					<div
						className="absolute inset-0 bg-black/50"
						onClick={() => {
							setDeleteBudgetPending(false);
							setDeleteBudgetError(null);
						}}
						aria-hidden="true"
					/>
					<div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
						<h2 className="mb-4 text-xl font-bold text-gray-900">Delete Budget</h2>
						<p className="mb-4 text-sm text-gray-600">Select the budget to delete. This will remove all allocations and cannot be undone.</p>
						<div className="mb-4 space-y-4">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-gray-700">Owner</label>
								<select
									value={deleteModalOwner}
									onChange={(e) => setDeleteModalOwner(e.target.value)}
									className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								>
									<option value="">Select owner</option>
									{deleteModalOwners.map((o) => (
										<option key={o} value={o}>
											{o}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="mb-1.5 block text-sm font-medium text-gray-700">Year</label>
								<select
									value={deleteModalYear}
									onChange={(e) => setDeleteModalYear(e.target.value)}
									className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								>
									<option value="">Select year</option>
									{deleteModalYears.map((y) => (
										<option key={y} value={String(y)}>
											{y}
										</option>
									))}
								</select>
							</div>
						</div>
						{deleteBudgetError && <p className="mb-4 text-sm text-red-600">{deleteBudgetError}</p>}
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => {
									setDeleteBudgetPending(false);
									setDeleteBudgetError(null);
								}}
								className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								disabled={!deleteModalOwner || !deleteModalYear}
								onClick={async () => {
									if (!deleteModalOwner || !deleteModalYear) return;
									setDeleteBudgetError(null);
									try {
										const res = await fetch(`/api/budgets/${deleteModalYear}?owner=${encodeURIComponent(deleteModalOwner)}`, { method: "DELETE" });
										const data = await res.json();
										if (!res.ok) throw new Error(data.error || "Failed to delete");
										setDeleteBudgetPending(false);
										if (deleteModalOwner === budgetOwner) {
											const ownerParam = budgetOwner ? `?owner=${encodeURIComponent(budgetOwner)}` : "";
											const yearsRes = await fetch(`/api/budgets${ownerParam}`);
											const years: number[] = await yearsRes.json();
											if (Array.isArray(years) && years.length > 0) {
												setBudgetYears(years);
												setBudgetYear(String(years[0]));
											} else {
												setBudgetYears([]);
											}
										}
									} catch (err) {
										setDeleteBudgetError(err instanceof Error ? err.message : "Failed to delete budget");
									}
								}}
								className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Add New Budget Modal */}
			{addBudgetModalOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
					<div className="absolute inset-0 bg-black/50" onClick={() => setAddBudgetModalOpen(false)} aria-hidden="true" />
					<div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
						<h2 className="mb-6 text-xl font-bold text-gray-800">Add New Budget</h2>
						<div className="space-y-4">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-gray-700">Owner</label>
								<select
									value={newBudgetOwner}
									onChange={(e) => setNewBudgetOwner(e.target.value)}
									className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								>
									{createModalOwners.length === 0 ? (
										<option value="">No owners – add a card first</option>
									) : (
										createModalOwners.map((o) => (
											<option key={o} value={o}>
												{o}
											</option>
										))
									)}
								</select>
							</div>
							<div>
								<label className="mb-1.5 block text-sm font-medium text-gray-700">Budget Year</label>
								<select
									value={newBudgetYear}
									onChange={(e) => setNewBudgetYear(e.target.value)}
									className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								>
									{[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
										<option key={y} value={String(y)}>
											{y}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="mb-1.5 block text-sm font-medium text-gray-700">
									Copy from Owner <span className="text-gray-400 font-normal">(optional)</span>
								</label>
								<select
									value={copyFromOwner}
									onChange={(e) => setCopyFromOwner(e.target.value)}
									className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								>
									<option value="">Don&apos;t copy</option>
									{createModalOwners.map((o) => (
										<option key={o} value={o}>
											{o}
										</option>
									))}
								</select>
							</div>
							{copyFromOwner && (
								<div>
									<label className="mb-1.5 block text-sm font-medium text-gray-700">
										Copy from Year <span className="text-red-500">(required)</span>
									</label>
									<select
										value={copyFromYear}
										onChange={(e) => setCopyFromYear(e.target.value)}
										className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
									>
										<option value="">Select year</option>
										{copyFromYears.map((y) => (
											<option key={y} value={String(y)}>
												{y}
											</option>
										))}
									</select>
								</div>
							)}
							{createBudgetError && <p className="text-sm text-red-600">{createBudgetError}</p>}
							<div className="flex justify-end gap-3 pt-2">
								<button
									type="button"
									onClick={() => setAddBudgetModalOpen(false)}
									disabled={createBudgetLoading}
									className="rounded-lg border border-primary bg-white px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
								>
									Cancel
								</button>
								<button
									type="button"
									disabled={!newBudgetOwner || createBudgetLoading || createModalOwners.length === 0 || (!!copyFromOwner && !copyFromYear)}
									onClick={async () => {
										setCreateBudgetError(null);
										setCreateBudgetLoading(true);
										try {
											const body: { owner: string; year: number; copyFromOwner?: string; copyFromYear?: number } = {
												owner: newBudgetOwner,
												year: parseInt(newBudgetYear, 10),
											};
											if (copyFromOwner && copyFromYear) {
												body.copyFromOwner = copyFromOwner;
												body.copyFromYear = parseInt(copyFromYear, 10);
											}
											const res = await fetch("/api/budgets", {
												method: "POST",
												headers: { "Content-Type": "application/json" },
												body: JSON.stringify(body),
											});
											const data = await res.json();
											if (!res.ok) {
												throw new Error(data.error || "Failed to create budget");
											}
											setSelectedOwner(newBudgetOwner);
											setBudgetYear(newBudgetYear);
											setAddBudgetModalOpen(false);
										} catch (err) {
											setCreateBudgetError(err instanceof Error ? err.message : "Failed to create budget");
										} finally {
											setCreateBudgetLoading(false);
										}
									}}
									className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{createBudgetLoading ? "Creating..." : "Create"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
