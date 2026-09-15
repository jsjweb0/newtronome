export const FREE_BOARD_CATEGORIES = [
    { value: 'chat', label: '수다' },
    { value: 'quote', label: '문장' },
    { value: 'recommendation', label: '추천' },
    { value: 'question', label: '질문' },
] as const;

export type FreeBoardCategoryValue =
    (typeof FREE_BOARD_CATEGORIES)[number]['value'];

export const FREE_BOARD_CATEGORY_LABELS: Record<string, string> = {
    chat: '수다',
    quote: '문장',
    recommendation: '추천',
    question: '질문',

    // 기존 게시글 임시 호환
    카테고리1: '수다',
    카테고리2: '문장',
    카테고리3: '추천',
    카테고리4: '질문',
};

export const LEGACY_FREE_BOARD_CATEGORY_VALUES: Record<string, string> = {
    카테고리1: 'chat',
    카테고리2: 'quote',
    카테고리3: 'recommendation',
    카테고리4: 'question',
};

export function isFreeBoardCategoryValue(
    value: string
): value is FreeBoardCategoryValue {
    return FREE_BOARD_CATEGORIES.some(
        (category) => category.value === value
    );
}