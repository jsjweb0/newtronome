export type BoardListSearchParams = {
    page: number;
    keyword: string;
    category?: string;
    sort: 'asc' | 'desc';
}

export function createBoardListSearch({
    page,
    keyword,
    category,
    sort,
}: BoardListSearchParams): string {
    const searchParams = new URLSearchParams();

    searchParams.set('page', String(page));

    if (keyword.trim()) {
        searchParams.set('keyword', keyword.trim());
    }

    if (category) {
        searchParams.set('category', category);
    }

    searchParams.set('sort', sort);

    return `?${searchParams.toString()}`;
}