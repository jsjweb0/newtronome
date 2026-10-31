import type { Post } from '../types/post';

type BoardListOptions = {
  keyword: string;
  category: string;
  sort: 'asc' | 'desc';
};

export function filterAndSortBoardPosts(
  posts: Post[],
  { keyword, category, sort }: BoardListOptions,
) {
  const normalizedKeyword = keyword.toLowerCase();

  return posts
    .filter((post) => {
      const matchesKeyword = post.title
        .toLowerCase()
        .includes(normalizedKeyword);

      const matchesCategory =
        category === '' || post.category === category;

      return matchesKeyword && matchesCategory;
    })
    .sort((a, b) => {
      const aTime = a.date?.getTime();
      const bTime = b.date?.getTime();

      if (aTime == null) return bTime == null ? a.id.localeCompare(b.id) : 1;
      if (bTime == null) return -1;

      const difference = sort === 'desc'
        ? bTime - aTime   // 최신 글이 위
        : aTime - bTime;  // 오래된 글이 위

      return difference || a.id.localeCompare(b.id);
    });
}
