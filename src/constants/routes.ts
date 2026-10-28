interface RouteMetadata {
  path: string;
  title: string;
}

export const BOARD_TITLES = {
  notice: '공지사항',
  free: '자유게시판',
  pet: '반려동물 게시판',
} as const;

export type BoardType = keyof typeof BOARD_TITLES;

export const getBoardTitle = (boardType?: string) => {
  if (!boardType || !(boardType in BOARD_TITLES)) {
    return '게시판';
  }

  return BOARD_TITLES[boardType as BoardType];
};

export const createBoardPath = (boardType: BoardType) => `/board/${boardType}`;

export const ROUTES = {
  home: { path: '/', title: '홈' },
  login: { path: '/login', title: '로그인' },
  signup: { path: '/signup', title: '회원가입' },
  account: { path: '/account', title: '내 계정' },
  likes: { path: '/likes', title: '좋아요' },
  search: { path: '/search', title: '음악 검색' },
  mypage: { path: '/mypage', title: '내 활동' },
  boardEdit: { path: '/board/:boardType/edit/:id', title: '게시글 수정' },
  boardWrite: { path: '/board/:boardType/write', title: '글쓰기' },
  boardDetail: { path: '/board/:boardType/:id', title: '게시글 상세' },
  boardList: { path: '/board/:boardType', title: '게시판' },
  petBoard: { path: '/board/pet', title: '반려동물 게시판' },
  petDetail: { path: '/board/pet/:id', title: '반려동물 게시글 상세' },
} as const satisfies Record<string, RouteMetadata>;
