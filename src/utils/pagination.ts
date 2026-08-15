export const DEFAULT_ITEMS_PER_PAGE = 10;

export function getCurrentPageItems<T>(
  items: readonly T[],
  currentPage: number,
  itemsPerPage: number = DEFAULT_ITEMS_PER_PAGE
): T[] {
  const startIndex = (currentPage - 1) * itemsPerPage;

  return items.slice(startIndex, startIndex + itemsPerPage);
}

export function getTotalPages(
  totalItems: number,
  itemsPerPage: number = DEFAULT_ITEMS_PER_PAGE
): number {
  return Math.ceil(totalItems / itemsPerPage);
}
