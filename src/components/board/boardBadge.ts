import type { CommunityBoardType } from '../../features/board/types/post';

export const BOARD_BADGE: Record<CommunityBoardType, { label: string; className: string }> = {
  free: {
    label: '자유게시판',
    className: 'bg-sky-500/10 text-sky-700 dark:bg-[#7CC4FF]/14 dark:text-[#7CC4FF]',
  },
  notice: {
    label: '공지사항',
    className: 'bg-primary/12 text-primary',
  },
};

export function getBoardBadge(boardType: string) {
  return boardType === 'notice' || boardType === 'free'
    ? BOARD_BADGE[boardType]
    : { label: boardType, className: 'bg-field text-textSub' };
}
