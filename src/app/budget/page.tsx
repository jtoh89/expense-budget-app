"use client";

import { useState, useEffect, useRef } from "react";
import { formatCurrency, formatCurrencyRounded, parseCurrencyInput } from "@/lib/currency";
import AddBudgetItemModal from "@/components/AddBudgetItemModal";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, CategoryScale, Tooltip, Legend);

const CHART_COLORS = [
  "#10b981",
  "#7dd3fc",
  "#f97316",
  "#ef4444",
  "#a78bfa",
  "#1e40af",
  "#ec4899",
  "#14b8a6",
  "#eab308",
  "#6366f1",
];

type CategoryRow = {
  subcategoryId: string;
  expense: string;
  monthly: number;
  annual: number;
  irsLimit?: number;
  match?: string;
};

const CATEGORY_SECTIONS: {
  name: string;
  hasIrsLimit?: boolean;
  hasMatch?: boolean;
  rows: CategoryRow[];
}[] = [
  {
    name: "Pretax",
    hasIrsLimit: true,
    hasMatch: true,
    rows: [
      { subcategoryId: "401k_403b", expense: "Invest in 401k/403b", monthly: 1500, annual: 18000, irsLimit: 23000, match: "4%" },
      { subcategoryId: "457b", expense: "Invest in 457b", monthly: 500, annual: 6000, irsLimit: 23000, match: "0%" },
      { subcategoryId: "hsa_fsa", expense: "HSA/FSA", monthly: 300, annual: 3600, irsLimit: 4150, match: "—" },
      { subcategoryId: "pension", expense: "SFGH Pension (9.5%)", monthly: 1200, annual: 14400, irsLimit: 0, match: "9.5%" },
    ],
  },
  {
    name: "Investments",
    rows: [
      { subcategoryId: "roth_ira", expense: "Roth IRA", monthly: 500, annual: 6000 },
      { subcategoryId: "stocks", expense: "Invest into stocks", monthly: 300, annual: 3600 },
      { subcategoryId: "real_estate", expense: "Invest in real estate", monthly: 200, annual: 2400 },
      { subcategoryId: "misc_investments", expense: "Misc Investments", monthly: 100, annual: 1200 },
    ],
  },
  {
    name: "Future",
    rows: [
      { subcategoryId: "wedding", expense: "Wedding", monthly: 500, annual: 6000 },
      { subcategoryId: "car", expense: "Car", monthly: 300, annual: 3600 },
    ],
  },
  {
    name: "Fixed",
    rows: [
      { subcategoryId: "mortgage", expense: "Mortgage", monthly: 2500, annual: 30000 },
      { subcategoryId: "rent", expense: "Rent (if don't own)", monthly: 0, annual: 0 },
      { subcategoryId: "utilities", expense: "Utilities", monthly: 200, annual: 2400 },
      { subcategoryId: "internet", expense: "Internet", monthly: 80, annual: 960 },
      { subcategoryId: "cell_phone", expense: "Cell Phone", monthly: 100, annual: 1200 },
      { subcategoryId: "whole_life", expense: "Whole Life Insurance", monthly: 150, annual: 1800 },
      { subcategoryId: "disability", expense: "Disability Insurance", monthly: 0, annual: 0 },
      { subcategoryId: "health_insurance", expense: "Health insurance", monthly: 400, annual: 4800 },
      { subcategoryId: "car_payment", expense: "Car Payment", monthly: 450, annual: 5400 },
      { subcategoryId: "car_insurance", expense: "Car Insurance", monthly: 120, annual: 1440 },
      { subcategoryId: "tuition", expense: "Tuition", monthly: 0, annual: 0 },
      { subcategoryId: "subscriptions", expense: "Subscription", monthly: 50, annual: 600 },
    ],
  },
  {
    name: "Flexible",
    rows: [
      { subcategoryId: "groceries", expense: "Groceries", monthly: 600, annual: 7200 },
      { subcategoryId: "dining_out", expense: "Dining Out", monthly: 300, annual: 3600 },
      { subcategoryId: "home_supplies", expense: "Home Supplies", monthly: 100, annual: 1200 },
      { subcategoryId: "gas", expense: "Gas", monthly: 200, annual: 2400 },
      { subcategoryId: "shopping", expense: "Shopping", monthly: 150, annual: 1800 },
      { subcategoryId: "beauty", expense: "Beauty", monthly: 80, annual: 960 },
      { subcategoryId: "pet_care", expense: "Pet Care", monthly: 100, annual: 1200 },
      { subcategoryId: "entertainment", expense: "Entertainment", monthly: 150, annual: 1800 },
      { subcategoryId: "charity", expense: "Charity/Donations", monthly: 50, annual: 600 },
      { subcategoryId: "miscellaneous", expense: "Miscellaneous", monthly: 100, annual: 1200 },
      { subcategoryId: "rentals", expense: "Rentals", monthly: 0, annual: 0 },
      { subcategoryId: "business", expense: "Business/Side-Hustle", monthly: 0, annual: 0 },
    ],
  },
  {
    name: "Luxury",
    rows: [
      { subcategoryId: "travel", expense: "Travel", monthly: 300, annual: 3600 },
      { subcategoryId: "gifts", expense: "Gifts", monthly: 100, annual: 1200 },
    ],
  },
];

export default function BudgetPage() {
  const [budgetYear, setBudgetYear] = useState("2026");
  const [annualIncome, setAnnualIncome] = useState(150000);
  const [otherIncome, setOtherIncome] = useState(20000);
  const [estimatedTaxes, setEstimatedTaxes] = useState(40000);
  const [categoryRows, setCategoryRows] = useState(CATEGORY_SECTIONS);
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
    fetch("/api/budgets?owners=true")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const list = data.filter((o): o is string => typeof o === "string");
          setOwners(list);
          setSelectedOwner((prev) => (prev && list.includes(prev) ? prev : list[0] ?? null));
        } else {
          setOwners([]);
        }
      })
      .catch(() => setOwners([]));
  }, []);

  useEffect(() => {
    if (addBudgetModalOpen) {
      setCreateBudgetError(null);
      setCopyFromOwner("");
      setCopyFromYear("");
      setCopyFromYears([]);
      setNewBudgetYear(String(parseInt(budgetYear, 10) + 1));
      const currentOwner = selectedOwner ?? owners[0] ?? "";
      Promise.all([
        fetch("/api/budgets?owners=true").then((r) => r.json()),
        fetch("/api/cards").then((r) => r.json()),
      ]).then(([budgetOwners, cards]) => {
        const fromBudgets = Array.isArray(budgetOwners) ? budgetOwners.filter((o) => typeof o === "string") : [];
        const fromCards = Array.isArray(cards) ? [...new Set(cards.map((c: { owner?: string }) => c.owner).filter(Boolean))] as string[] : [];
        const list = [...new Set([...fromBudgets, ...fromCards])].sort();
        setCreateModalOwners(list);
        setNewBudgetOwner(list.includes(currentOwner) ? currentOwner : list[0] ?? "");
      });
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
      if (
        categoryChartDropdownRef.current && !categoryChartDropdownRef.current.contains(e.target as Node)
      ) {
        setCategoryChartDropdownOpen(false);
      }
      if (
        subChartDropdownRef.current && !subChartDropdownRef.current.contains(e.target as Node)
      ) {
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
    setIncomeLoading(true);
    const ownerParam = budgetOwner ? `?owner=${encodeURIComponent(budgetOwner)}` : "";
    fetch(`/api/budgets/${budgetYear}${ownerParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.annualIncome === "number") {
          setAnnualIncome(data.annualIncome);
          setOtherIncome(data.otherIncome);
          setEstimatedTaxes(data.estimatedTaxes);
        }
      })
      .catch(() => {})
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
    const ownerParam = budgetOwner ? `&owner=${encodeURIComponent(budgetOwner)}` : "";
    fetch(`/api/budget-allocations?year=${budgetYear}${ownerParam}`)
      .then((res) => res.json())
      .then((allocations: Record<string, { monthlyBudget: number; annualBudget: number | null; irsLimit: number | null; employerMatch: number | null }>) => {
        if (cancelled || !allocations || typeof allocations !== "object") return;
        setCategoryRows((prev) =>
          prev.map((section) => ({
            ...section,
            rows: section.rows.map((row) => {
              const alloc = allocations[row.subcategoryId];
              if (!alloc) return row;
              const matchStr =
                alloc.employerMatch != null
                  ? alloc.employerMatch === 0
                    ? "0%"
                    : `${alloc.employerMatch}%`
                  : row.match;
              return {
                ...row,
                monthly: alloc.monthlyBudget,
                annual: alloc.annualBudget ?? alloc.monthlyBudget * 12,
                irsLimit: alloc.irsLimit ?? row.irsLimit,
                match: matchStr ?? row.match,
              };
            }),
          }))
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAllocationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [budgetYear, budgetOwner]);

  const parseMatchPct = (s: string | undefined): number => {
    if (!s || s === "—" || s === "-") return 0;
    const m = s.replace(/%/g, "").trim();
    const n = parseFloat(m);
    return isNaN(n) ? 0 : n;
  };

  const getPretaxMyContribution = (irsLimit: number, matchPct: number) => {
    const employerMatch = irsLimit * (matchPct / 100);
    return Math.max(0, irsLimit - employerMatch);
  };

  const getSectionTotals = (rows: CategoryRow[], sectionName: string) => {
    if (sectionName === "Pretax") {
      return rows.reduce(
        (acc, row) => {
          const annual = getPretaxMyContribution(
            row.irsLimit ?? 0,
            parseMatchPct(row.match)
          );
          return {
            monthly: acc.monthly + annual / 12,
            annual: acc.annual + annual,
          };
        },
        { monthly: 0, annual: 0 }
      );
    }
    return rows.reduce(
      (acc, row) => ({
        monthly: acc.monthly + row.monthly,
        annual: acc.annual + row.annual,
      }),
      { monthly: 0, annual: 0 }
    );
  };

  const getRowAnnual = (section: { name: string; rows: CategoryRow[] }, row: CategoryRow) => {
    if (section.name === "Pretax" && section.rows) {
      return getPretaxMyContribution(row.irsLimit ?? 0, parseMatchPct(row.match));
    }
    return row.annual;
  };

  const categoryChartItems = categoryRows
    .filter((s) => selectedCategoriesForCategoryChart.length === 0 || selectedCategoriesForCategoryChart.includes(s.name))
    .map((s, i) => ({
      name: s.name,
      value: getSectionTotals(s.rows, s.name).annual,
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
    selectedCategoriesForSubChart.length > 0
      ? categoryRows.filter((s) => selectedCategoriesForSubChart.includes(s.name))
      : categoryRows
  ).flatMap((s) => s.rows);

  const subcategoryChartItems = subcategoryRowsForChart
    .map((r, i) => {
      const section = categoryRows.find((s) =>
        s.rows.some((row) => row.subcategoryId === r.subcategoryId)
      );
      const annual = section ? getRowAnnual(section, r) : r.annual;
      return { row: r, annual, color: CHART_COLORS[i % CHART_COLORS.length] };
    })
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

  const updatePretaxRow = (rowIdx: number, field: "irsLimit" | "match", value: string | number) => {
    setCategoryRows((prev) => {
      const sections = prev.map((s) =>
        s.name === "Pretax"
          ? {
              ...s,
              rows: s.rows.map((r, i) =>
                i === rowIdx ? { ...r, [field]: value } : r
              ),
            }
          : s
      );
      return sections;
    });
  };

  const updateCategoryRow = (
    sectionName: string,
    rowIdx: number,
    field: "monthly" | "annual",
    value: number
  ) => {
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
          : s
      )
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
        `/api/transactions/has-for-subcategory?subcategoryId=${encodeURIComponent(row.subcategoryId)}&year=${budgetYear}&owner=${encodeURIComponent(budgetOwner)}`
      );
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.error || "Failed to check transactions");

      if (checkData.hasTransactions) {
        setDeleteError("Cannot delete: there are existing transactions for this subcategory, year, and owner. Remove or reassign those transactions first.");
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

      setCategoryRows((prev) =>
        prev.map((s) =>
          s.name === sectionName
            ? { ...s, rows: s.rows.filter((_, i) => i !== rowIdx) }
            : s
        )
      );
      closeDeleteModal();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const addCategoryRow = (sectionName: string, row: CategoryRow) => {
    setCategoryRows((prev) =>
      prev.map((s) =>
        s.name === sectionName
          ? { ...s, rows: [...s.rows, row] }
          : s
      )
    );
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
          const employerMatch =
            row.match != null && row.match !== "—" && row.match !== "-"
              ? parseMatchPct(row.match)
              : null;
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
                irsLimit: row.irsLimit ?? null,
                employerMatch,
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
      setCategoryRows((prev) =>
        prev.map((s) =>
          s.name === sectionName ? { ...s, rows: snapshot } : s
        )
      );
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
  const pretaxTotals = pretaxSection
    ? getSectionTotals(pretaxSection.rows, "Pretax")
    : { monthly: 0, annual: 0 };
  const adjustedGrossIncome = Math.max(
    0,
    annualIncome + otherIncome - pretaxTotals.annual
  );
  const takeHomePay = Math.max(0, adjustedGrossIncome - estimatedTaxes);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Budget Planner */}
      <div className="mb-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-800">{budgetYear} Budget Planner</h1>
          <div className="flex items-end gap-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Budget Year
              </label>
              <select
                value={budgetYear}
                onChange={(e) => setBudgetYear(e.target.value)}
                className="w-full min-w-[120px] rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {budgetYears.length > 0 ? (
                  budgetYears.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))
                ) : (
                  <option value={budgetYear}>{budgetYear}</option>
                )}
              </select>
            </div>
            <div className="relative" ref={ownersDropdownRef}>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Budget
              </label>
              <button
                type="button"
                onClick={() => setOwnersDropdownOpen((o) => !o)}
                className="flex min-w-[140px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-gray-800 shadow-sm hover:bg-gray-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <span className="truncate">
                  {budgetOwner || "—"}
                </span>
                <svg className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${ownersDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {ownersDropdownOpen && (
                <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                  {owners.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-gray-500">No budgets</p>
                  ) : (
                    owners.map((owner) => (
                        <button
                          key={owner}
                          type="button"
                          onClick={() => {
                            setSelectedOwner(owner);
                            setOwnersDropdownOpen(false);
                          }}
                          className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left hover:bg-gray-50"
                        >
                        <span className={`h-4 w-4 rounded-full border-2 ${selectedOwner === owner ? "border-primary bg-primary" : "border-gray-300"}`} />
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-800">
              Income
            </h3>
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
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Annual Income
              </label>
              {editingIncome ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={annualIncome === 0 ? "" : formatCurrencyRounded(annualIncome)}
                  onChange={(e) =>
                    setAnnualIncome(parseCurrencyInput(e.target.value))
                  }
                  placeholder="$0"
                  className="w-36 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <p className="py-2.5 text-base font-medium text-gray-800">
                  {fmt(annualIncome)}
                </p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Other Income
              </label>
              {editingIncome ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={otherIncome === 0 ? "" : formatCurrencyRounded(otherIncome)}
                  onChange={(e) =>
                    setOtherIncome(parseCurrencyInput(e.target.value))
                  }
                  placeholder="$0"
                  className="w-36 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <p className="py-2.5 text-base font-medium text-gray-800">
                  {fmt(otherIncome)}
                </p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Estimated Taxes{" "}
                <a
                  href={`https://www.talent.com/tax-calculator?salary=${annualIncome + otherIncome || 200000}&from=year&region=California`}
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
                  onChange={(e) =>
                    setEstimatedTaxes(parseCurrencyInput(e.target.value))
                  }
                  placeholder="$0"
                  className="w-36 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <p className="py-2.5 text-base font-medium text-gray-800">
                  {fmt(estimatedTaxes)}
                </p>
              )}
            </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Adjusted Gross Income
            </label>
            <p className="py-2.5 text-base font-medium text-gray-800">
              {fmt(adjustedGrossIncome)}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Take Home Pay
            </label>
            <p className="py-2.5 text-base font-medium text-gray-800">
              {fmt(takeHomePay)}
            </p>
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
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Budget Categories
        </h2>
        {/* Category Budget Allocation */}
        <div className="mb-10">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-800">
                Category Budget Allocation
              </h3>
              <div className="relative" ref={categoryChartDropdownRef}>
                <button
                  type="button"
                  onClick={() => setCategoryChartDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-w-[180px]"
                >
                  <span className="truncate">
                    {selectedCategoriesForCategoryChart.length === 0
                      ? "All Categories"
                      : `${selectedCategoriesForCategoryChart.length} selected`}
                  </span>
                  <svg className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${categoryChartDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {categoryChartDropdownOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    {categoryRows.map((s) => (
                      <label key={s.name} className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={
                            selectedCategoriesForCategoryChart.length === 0 ||
                            selectedCategoriesForCategoryChart.includes(s.name)
                          }
                          onChange={() => {
                            setSelectedCategoriesForCategoryChart((prev) => {
                              const allNames = categoryRows.map((x) => x.name);
                              const next = prev.length === 0
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
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="text-sm text-gray-700 truncate">{c.name}</span>
                    <span className="text-sm text-gray-500 ml-auto shrink-0">
                      {fmt(c.value)}
                    </span>
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
              <h3 className="text-xl font-bold text-gray-800">
                Sub Category Budget Allocation
              </h3>
              <div className="relative" ref={subChartDropdownRef}>
                <button
                  type="button"
                  onClick={() => setSubChartDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm hover:bg-gray-50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-w-[180px]"
                >
                  <span className="truncate">
                    {selectedCategoriesForSubChart.length === 0
                      ? "All Categories"
                      : `${selectedCategoriesForSubChart.length} selected`}
                  </span>
                  <svg className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${subChartDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {subChartDropdownOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    {categoryRows.map((s) => (
                      <label key={s.name} className="flex cursor-pointer items-center gap-2 px-4 py-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={
                            selectedCategoriesForSubChart.length === 0 ||
                            selectedCategoriesForSubChart.includes(s.name)
                          }
                          onChange={() => {
                            setSelectedCategoriesForSubChart((prev) => {
                              const allNames = categoryRows.map((x) => x.name);
                              const next = prev.length === 0
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
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-700 truncate">{item.row.expense}</span>
                    <span className="text-sm text-gray-500 ml-auto shrink-0">
                      {fmt(item.annual)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Budget Expenses */}
        <h2 className="mb-6 text-xl font-bold text-gray-800">
          Budget Expenses
        </h2>

        {categoryRows.map((section, sectionIdx) => {
          const totals = getSectionTotals(section.rows, section.name);
          return (
            <div key={section.name} className={sectionIdx < categoryRows.length - 1 ? "mb-10" : ""}>
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-800">
                  {section.name}
                </h3>
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                        Expense
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Monthly
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                        Annual
                      </th>
                      {section.hasIrsLimit && (
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          IRS Limit
                        </th>
                      )}
                      {section.hasMatch && (
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                          Match
                        </th>
                      )}
                      {editingSections.includes(section.name) && (
                        <th className="w-12 px-2 py-3" aria-label="Actions" />
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row, i) => {
                      const isPretax = section.name === "Pretax";
                      const isEditing = editingSections.includes(section.name);
                      const myAnnual =
                        isPretax && section.hasIrsLimit && section.hasMatch
                          ? getPretaxMyContribution(
                              row.irsLimit ?? 0,
                              parseMatchPct(row.match)
                            )
                          : row.annual;
                      const myMonthly = isPretax ? myAnnual / 12 : row.monthly;
                      return (
                        <tr
                          key={i}
                          className={`border-t border-gray-100 ${
                            i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="block px-3 py-2 text-sm text-gray-800">
                              {row.expense}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {isPretax ? (
                              <span className="block text-sm text-gray-800">
                                {fmt(myMonthly)}
                              </span>
                            ) : isEditing ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formatCurrencyRounded(row.monthly)}
                                onChange={(e) =>
                                  updateCategoryRow(
                                    section.name,
                                    i,
                                    "monthly",
                                    parseCurrencyInput(e.target.value)
                                  )}
                                className="w-28 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-right text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            ) : (
                              <span className="block text-sm text-gray-800">
                                {fmt(row.monthly)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {isPretax ? (
                              <span className="block text-sm text-gray-800">
                                {fmt(myAnnual)}
                              </span>
                            ) : isEditing ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formatCurrencyRounded(row.annual)}
                                onChange={(e) =>
                                  updateCategoryRow(
                                    section.name,
                                    i,
                                    "annual",
                                    parseCurrencyInput(e.target.value)
                                  )}
                                className="w-28 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-right text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            ) : (
                              <span className="block text-sm text-gray-800">
                                {fmt(row.annual)}
                              </span>
                            )}
                          </td>
                          {section.hasIrsLimit && (
                            <td className="px-4 py-3 text-right tabular-nums">
                              {isEditing ? (
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={row.irsLimit != null ? formatCurrencyRounded(row.irsLimit) : ""}
                                  onChange={(e) =>
                                    updatePretaxRow(
                                      i,
                                      "irsLimit",
                                      parseCurrencyInput(e.target.value)
                                    )}
                                  placeholder="$0"
                                  className="w-28 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-right text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              ) : (
                                <span className="block text-sm text-gray-800">
                                  {budgetOwner ? (row.irsLimit != null ? formatCurrencyRounded(row.irsLimit) : "—") : "—"}
                                </span>
                              )}
                            </td>
                          )}
                          {section.hasMatch && (
                            <td className="px-4 py-3 text-right tabular-nums">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={row.match ?? ""}
                                  onChange={(e) =>
                                    updatePretaxRow(i, "match", e.target.value)
                                  }
                                  placeholder="e.g. 4%"
                                  className="w-28 rounded border border-gray-300 bg-white px-3 py-2 text-sm text-right text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              ) : (
                                <span className="block text-sm text-gray-800">
                                  {budgetOwner ? (row.match ?? "—") : "—"}
                                </span>
                              )}
                            </td>
                          )}
                          {isEditing && (
                            <td className="px-2 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => openDeleteModal(section.name, i, row)}
                                className="inline-flex items-center justify-center rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                                aria-label="Delete row"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        <td
                          colSpan={
                            3 +
                            (section.hasIrsLimit ? 1 : 0) +
                            (section.hasMatch ? 1 : 0) +
                            1
                          }
                          className="px-4 py-3"
                        >
                          <button
                            type="button"
                            onClick={() => setAddItemModalSection(section.name)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-hover mx-auto"
                            aria-label="Add row"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-800">
                        {fmt(totals.monthly)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums text-gray-800">
                        {fmt(totals.annual)}
                      </td>
                      {section.hasIrsLimit && (
                        <td className="px-4 py-3 text-right text-sm text-gray-800">—</td>
                      )}
                      {section.hasMatch && (
                        <td className="px-4 py-3 text-right text-sm text-gray-800">—</td>
                      )}
                      {editingSections.includes(section.name) && (
                        <td className="w-12 px-2 py-3" />
                      )}
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
          existingSubcategoryIds={
            categoryRows.find((s) => s.name === addItemModalSection)?.rows.map((r) => r.subcategoryId) ?? []
          }
          hasIrsLimit={categoryRows.find((s) => s.name === addItemModalSection)?.hasIrsLimit}
          hasMatch={categoryRows.find((s) => s.name === addItemModalSection)?.hasMatch}
        />
      )}

      {/* Delete Budget Item Modal */}
      {deletePending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDeleteModal}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Delete Budget Item?
            </h2>
            <p className="mb-2 text-sm text-gray-600">
              Are you sure you want to delete &quot;{deletePending.row.expense}&quot;?
            </p>
            <p className="mb-6 text-sm text-gray-600">
              This action cannot be undone.
            </p>
            {deleteError && (
              <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {deleteError}
              </p>
            )}
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
            onClick={() => { setDeleteBudgetPending(false); setDeleteBudgetError(null); }}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Delete Budget
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              Select the budget to delete. This will remove all allocations and cannot be undone.
            </p>
            <div className="mb-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Owner
                </label>
                <select
                  value={deleteModalOwner}
                  onChange={(e) => setDeleteModalOwner(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select owner</option>
                  {deleteModalOwners.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Year
                </label>
                <select
                  value={deleteModalYear}
                  onChange={(e) => setDeleteModalYear(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select year</option>
                  {deleteModalYears.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            {deleteBudgetError && (
              <p className="mb-4 text-sm text-red-600">{deleteBudgetError}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setDeleteBudgetPending(false); setDeleteBudgetError(null); }}
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
                    const res = await fetch(
                      `/api/budgets/${deleteModalYear}?owner=${encodeURIComponent(deleteModalOwner)}`,
                      { method: "DELETE" }
                    );
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
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setAddBudgetModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-6 text-xl font-bold text-gray-800">
              Add New Budget
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Owner
                </label>
                <select
                  value={newBudgetOwner}
                  onChange={(e) => setNewBudgetOwner(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {createModalOwners.length === 0 ? (
                    <option value="">No owners – add a card first</option>
                  ) : (
                    createModalOwners.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Budget Year
                </label>
                <select
                  value={newBudgetYear}
                  onChange={(e) => setNewBudgetYear(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-800 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {[2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
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
                    <option key={o} value={o}>{o}</option>
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
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              )}
              {createBudgetError && (
                <p className="text-sm text-red-600">{createBudgetError}</p>
              )}
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
                  disabled={
                    !newBudgetOwner ||
                    createBudgetLoading ||
                    createModalOwners.length === 0 ||
                    (!!copyFromOwner && !copyFromYear)
                  }
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
