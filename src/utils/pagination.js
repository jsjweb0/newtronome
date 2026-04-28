export const DEFAULT_ITEMS_PER_PAGE = 10;

/**
 * 현재 페이지에 해당하는 아이템 배열을 잘라내는 함수
 * @param {Array} items - 전체 아이템 배열
 * @param {number} currentPage - 현재 페이지 번호 (1부터 시작)
 * @returns {Array} - 현재 페이지에 보여줄 아이템 배열
 */
export function getCurrentPageItems(items, currentPage, itemsPerPage = DEFAULT_ITEMS_PER_PAGE) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
}

/**
 * 전체 페이지 수를 계산하는 함수
 * @param {number} totalItems - 전체 아이템 수
 * @returns {number} - 총 페이지 수
 */
export function getTotalPages(totalItems, itemsPerPage = DEFAULT_ITEMS_PER_PAGE) {
    return Math.ceil(totalItems / itemsPerPage);
}
