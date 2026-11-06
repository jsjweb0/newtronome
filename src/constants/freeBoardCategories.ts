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
const FREE_BOARD_CATEGORY_BADGE_CLASSES: Record<FreeBoardCategoryValue, string> = {
    chat: 'bg-sky-500/10 text-sky-700 dark:bg-[#7CC4FF]/14 dark:text-[#7CC4FF]',
    quote: 'bg-pink-500/10 text-pink-700 dark:bg-[#F7A3B5]/14 dark:text-[#F7A3B5]',
    recommendation: 'bg-amber-500/12 text-amber-700 dark:bg-[#FFB54A]/14 dark:text-[#FFB54A]',
    question: 'bg-violet-500/10 text-violet-700 dark:bg-[#B8A6FF]/14 dark:text-[#B8A6FF]',
};

export function getFreeBoardCategoryBadgeClass(value: string | null | undefined): string {
    if (!value) return 'bg-field text-textSub';
    const normalized = LEGACY_FREE_BOARD_CATEGORY_VALUES[value] ?? value;

    return isFreeBoardCategoryValue(normalized)
        ? FREE_BOARD_CATEGORY_BADGE_CLASSES[normalized]
        : 'bg-field text-textSub';
}
