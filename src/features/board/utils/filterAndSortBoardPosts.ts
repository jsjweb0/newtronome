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
    .sort((firstPost, secondPost) => {
      const firstPostNo = Number.isFinite(Number(firstPost.postNo))
        ? Number(firstPost.postNo)
        : 0;

      const secondPostNo = Number.isFinite(Number(secondPost.postNo))
        ? Number(secondPost.postNo)
        : 0;

      return sort === 'asc'
        ? firstPostNo - secondPostNo
        : secondPostNo - firstPostNo;
    });
}
