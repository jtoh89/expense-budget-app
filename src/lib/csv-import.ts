/** Stored in `cards.single_column_debit_format` when `use_single_column` is true */
export const SINGLE_COLUMN_DEBIT_FORMATS = ["parentheses", "negative", "positive"] as const;
export type SingleColumnDebitFormat = (typeof SINGLE_COLUMN_DEBIT_FORMATS)[number];

export type CardConfig = {
	dateHeader: string;
	descriptionHeader: string;
	debitHeader: string | null;
	creditHeader: string | null;
	singleColumn: boolean;
	/** How single-column cells indicate debits vs credits; ignored when not single-column */
	singleColumnDebitFormat: SingleColumnDebitFormat | null;
};

export type ParsedTransaction = {
	date: string;
	description: string;
	debit: number;
	credit: number;
	/** For preview: display amount (negative = debit, positive = credit when single column) */
	amount: number;
};

/**
 * Parse CSV text into rows. Handles quoted values.
 */
function parseCSV(text: string): string[][] {
	const rows: string[][] = [];
	let current: string[] = [];
	let cell = "";
	let inQuotes = false;

	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (inQuotes) {
			if (c === '"') {
				inQuotes = false;
			} else {
				cell += c;
			}
		} else {
			if (c === '"') {
				inQuotes = true;
			} else if (c === ",") {
				current.push(cell.trim());
				cell = "";
			} else if (c === "\n" || c === "\r") {
				if (c === "\r" && text[i + 1] === "\n") i++;
				current.push(cell.trim());
				if (current.some((x) => x)) rows.push(current);
				current = [];
				cell = "";
			} else {
				cell += c;
			}
		}
	}
	current.push(cell.trim());
	if (current.some((x) => x)) rows.push(current);
	return rows;
}

/**
 * Find column index by header name (case-insensitive, trimmed).
 */
function findColumnIndex(headers: string[], name: string): number {
	const n = name.toLowerCase().trim();
	return headers.findIndex((h) => h.toLowerCase().trim() === n);
}

/**
 * Normalize date string to YYYY-MM-DD. Handles MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.
 */
function normalizeDate(val: string): string {
	const s = String(val || "").trim();
	if (!s) return "";
	const d = new Date(s);
	if (isNaN(d.getTime())) return s;
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

/**
 * Legacy single-column parsing (when `singleColumnDebitFormat` is null): debit if `(` or `-`.
 */
function parseAmountLegacy(val: string): { value: number; isDebit: boolean } {
	const s = String(val || "").trim();
	const isDebit = s.startsWith("(") || s.startsWith("-");
	const cleaned = s.replace(/[$,()]/g, "").trim();
	const num = parseFloat(cleaned.replace(/,/g, ""));
	const value = isNaN(num) ? 0 : Math.abs(num);
	return { value, isDebit };
}

/**
 * Single-column amount cell → absolute value + whether it books as debit.
 * - parentheses: debit when value is in accounting parentheses, e.g. `(50.00)`
 * - negative: debit when the cell starts with `-` (after optional `$`)
 * - positive: debit when the signed amount is &gt; 0 (plain positive = debit, negative or `(x)` = credit)
 */
export function parseSingleColumnAmount(raw: string, format: SingleColumnDebitFormat | null | undefined): { value: number; isDebit: boolean } {
	const s = String(raw || "").trim();
	if (format == null) {
		return parseAmountLegacy(s);
	}
	if (format === "parentheses") {
		const m = s.match(/^\s*\(\s*([^)]*)\s*\)\s*$/);
		const isDebit = m != null;
		const inner = (m ? m[1] : s).replace(/[$,]/g, "");
		const num = parseFloat(inner.replace(/,/g, ""));
		const value = isNaN(num) ? 0 : Math.abs(num);
		return { value, isDebit };
	}
	if (format === "negative") {
		const t = s.replace(/^\$/, "").trim();
		const isDebit = t.startsWith("-");
		const cleaned = t.replace(/^-/, "").replace(/[$,]/g, "");
		const num = parseFloat(cleaned.replace(/,/g, ""));
		const value = isNaN(num) ? 0 : Math.abs(num);
		return { value, isDebit };
	}
	// positive: signed amount — positive = debit, negative or parentheses = credit
	let t = s.replace(/[$,\s]/g, "").trim();
	let sign = 1;
	if (t.startsWith("(") && t.endsWith(")")) {
		sign = -1;
		t = t.slice(1, -1);
	} else if (t.startsWith("-")) {
		sign = -1;
		t = t.slice(1);
	} else if (t.startsWith("+")) {
		t = t.slice(1);
	}
	const n = parseFloat(t.replace(/,/g, "") || "0");
	if (isNaN(n)) return { value: 0, isDebit: false };
	const signed = sign * Math.abs(n);
	const value = Math.abs(n);
	const isDebit = signed > 0;
	return { value, isDebit };
}

export type ParseResult = { ok: true; transactions: ParsedTransaction[] } | { ok: false; error: string };

/**
 * Parse CSV and map to transactions using card column config.
 * Returns error if required columns (date, description, debit/credit) cannot be matched.
 */
export function parseCSVToTransactions(csvText: string, config: CardConfig): ParseResult {
	const rows = parseCSV(csvText);
	if (rows.length < 2) {
		return { ok: false, error: "CSV has no header or data rows." };
	}

	const headers = rows[0];
	const dataRows = rows.slice(1);
	const result: ParsedTransaction[] = [];

	const dateIdx = findColumnIndex(headers, config.dateHeader);
	const descIdx = findColumnIndex(headers, config.descriptionHeader);

	if (dateIdx < 0) {
		return { ok: false, error: `Date column "${config.dateHeader}" not found in CSV.` };
	}
	if (descIdx < 0) {
		return { ok: false, error: `Description column "${config.descriptionHeader}" not found in CSV.` };
	}

	let debitIdx = -1;
	let creditIdx = -1;
	let amountIdx = -1;

	if (config.singleColumn) {
		if (config.debitHeader && config.debitHeader.trim()) {
			amountIdx = findColumnIndex(headers, config.debitHeader);
			if (amountIdx < 0) {
				return {
					ok: false,
					error: `Amount column "${config.debitHeader.trim()}" not found in CSV.`,
				};
			}
		} else {
			const amountNames = ["amount", "balance", "total", "transaction amount", "sum"];
			for (const name of amountNames) {
				amountIdx = findColumnIndex(headers, name);
				if (amountIdx >= 0) break;
			}
			if (amountIdx < 0) {
				amountIdx = headers.findIndex((_, i) => i !== dateIdx && i !== descIdx);
			}
			if (amountIdx < 0) {
				return { ok: false, error: "Single-column mode: no amount column found in CSV." };
			}
		}
	} else {
		debitIdx = config.debitHeader ? findColumnIndex(headers, config.debitHeader) : -1;
		creditIdx = config.creditHeader ? findColumnIndex(headers, config.creditHeader) : -1;
		if (debitIdx < 0) {
			return {
				ok: false,
				error: config.debitHeader ? `Debit column "${config.debitHeader}" not found in CSV.` : "Debit column not configured. Check card settings.",
			};
		}
		if (creditIdx < 0) {
			return {
				ok: false,
				error: config.creditHeader
					? `Credit column "${config.creditHeader}" not found in CSV.`
					: "Credit column not configured. Check card settings.",
			};
		}
	}

	for (const row of dataRows) {
		const date = normalizeDate(row[dateIdx]?.trim() || "");
		const description = row[descIdx]?.trim() || "";
		if (!date && !description) continue;

		let debit = 0;
		let credit = 0;
		let amount = 0;

		if (config.singleColumn && amountIdx >= 0) {
			const { value, isDebit } = parseSingleColumnAmount(row[amountIdx] || "", config.singleColumnDebitFormat);
			if (isDebit) {
				debit = value;
				amount = -value;
			} else {
				credit = value;
				amount = value;
			}
		} else {
			debit = debitIdx >= 0 ? parseFloat(String(row[debitIdx] || "0").replace(/[$,]/g, "")) || 0 : 0;
			credit = creditIdx >= 0 ? parseFloat(String(row[creditIdx] || "0").replace(/[$,]/g, "")) || 0 : 0;
			amount = credit - debit;
		}

		result.push({ date, description, debit, credit, amount });
	}

	return { ok: true, transactions: result };
}
