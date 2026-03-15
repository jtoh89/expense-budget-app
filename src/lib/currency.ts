/**
 * Format a number as USD currency.
 */
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Format a number as USD currency, rounded up to whole dollars (no decimals).
 */
export function formatCurrencyRounded(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.ceil(n));
}

/**
 * Parse user input (e.g. "$1,234.56", "-$50.00") to a number.
 */
export function parseCurrencyInput(value: string): number {
  const trimmed = value.trim();
  const isNegative = trimmed.startsWith("-");
  const cleaned = trimmed.replace(/[$,]/g, "").replace(/^-/, "").trim();
  if (cleaned === "" || cleaned === "-") return 0;
  const parsed = parseFloat(cleaned);
  const result = isNaN(parsed) ? 0 : parsed;
  return isNegative ? -result : result;
}
