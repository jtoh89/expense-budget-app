/**
 * Label used in dashboard/breakdown APIs and for the "Uncategorized" subcategory in config.
 * Matches `__uncategorized__` bucket name resolution in `api/dashboard/*`.
 */
export const UNCATEGORIZED_SUBCATEGORY_LABEL = "Uncategorized";

/**
 * Text color for table cells and labels showing a subcategory name.
 * Uncategorized is highlighted in red so it stands out in grids.
 */
export function subCategoryNameTextClass(name: string, whenNotUncategorized: string = "text-gray-700"): string {
	return name.trim() === UNCATEGORIZED_SUBCATEGORY_LABEL ? "text-red-600" : whenNotUncategorized;
}
