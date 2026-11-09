import clsx from 'clsx';
import { ExternalLink as ExternalLinkIcon, Heart, Pause, Play, Share2 } from 'lucide-react';
import ExternalLink from '../../../components/ui/ExternalLink';
import { createPlaylistPath } from '../../../constants/routes';
import { useToast } from '../../../contexts/ToastContext';
import soundCloudFaviconBlack from '../../../assets/brands/soundcloud-favicon-black.webp';
import soundCloudFaviconWhite from '../../../assets/brands/soundcloud-favicon-white.webp';
import type { Playlist } from '../data/playlists';
import { usePlaylistBookmark } from '../hooks/usePlaylistBookmark';

interface PlaylistActionsProps {
  playlist: Playlist;
  /** 메인 플레이어에서 이 플레이리스트가 재생 중인지 */
  isPlaying: boolean;
  onPlay: () => void;
}

const focusRingClass =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const outlineClass =
  'border border-textSub/40 bg-background/25 text-textBase hover:border-textBase hover:bg-textSub/10 transition-colors';

/** 상세 상단 버튼 줄: 전체 재생 · SoundCloud에서 듣기 · 좋아요 · 공유 (시안 순서) */
export default function PlaylistActions({ playlist, isPlaying, onPlay }: PlaylistActionsProps) {
  const { showToast } = useToast();
  const { isSaved, isLoading, isSaving, error, toggleSaved } = usePlaylistBookmark(playlist);

  const handleShare = async () => {
    const url = new URL(createPlaylistPath(playlist.id), window.location.origin).href;

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `${playlist.title} | NEWTRONOME`, url });
      } catch (shareError) {
        // 사용자가 공유 창을 닫은 경우는 조용히 넘어감
        if (shareError instanceof DOMException && shareError.name === 'AbortError') return;
        showToast({ message: '공유하지 못했습니다.', type: 'error' });
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast({ message: '링크가 복사되었습니다!', type: 'success' });
    } catch {
      showToast({ message: '복사에 실패했습니다.', type: 'error' });
    }
  };

  const likeLabel = error ?? (isSaved ? '플레이리스트 저장 취소 (좋아요)' : '플레이리스트 저장 (좋아요)');

  return (
    <div className="flex flex-wrap items-center gap-2.5 mt-1">
      <button
        type="button"
        onClick={onPlay}
        className={clsx(
          'inline-flex items-center gap-2 min-h-13 px-6.5 rounded-full bg-primary text-onPrimary text-[15px] font-bold hover:bg-primary/85 transition-colors',
          focusRingClass
        )}
      >
        {isPlaying ? (
          <Pause aria-hidden="true" className="size-4.5 fill-current" />
        ) : (
          <Play aria-hidden="true" className="size-4.5 fill-current" />
        )}
        {isPlaying ? '일시정지' : '전체 재생'}
      </button>

      <ExternalLink
        href={playlist.soundCloudUrl}
        label="SoundCloud에서 듣기"
        className={clsx(
          'inline-flex items-center gap-2.5 min-h-13 pl-4.5 pr-5.5 rounded-full text-[15px] font-bold',
          outlineClass,
          focusRingClass
        )}
      >
        {/* 미디어킷 규칙: 밝은 배경엔 검정, 어두운 배경엔 흰색 로고 */}
        <img src={soundCloudFaviconBlack} alt="" className="h-4 w-auto dark:hidden" />
        <img src={soundCloudFaviconWhite} alt="" className="hidden h-4 w-auto dark:block" />
        SoundCloud에서 듣기
        <ExternalLinkIcon aria-hidden="true" className="size-4 text-textSub" />
      </ExternalLink>

      <button
        type="button"
        onClick={toggleSaved}
        disabled={isLoading || isSaving || error !== null}
        aria-pressed={isLoading || error !== null ? undefined : isSaved}
        aria-label={likeLabel}
        title={likeLabel}
        className={clsx(
          'inline-flex items-center justify-center size-13 rounded-full disabled:opacity-50 disabled:cursor-wait',
          outlineClass,
          focusRingClass
        )}
      >
        <Heart
          aria-hidden="true"
          className={clsx('size-5', isSaved && 'fill-primary text-primary')}
        />
      </button>

      <button
        type="button"
        onClick={handleShare}
        aria-label="공유"
        title="공유"
        className={clsx(
          'inline-flex items-center justify-center size-13 rounded-full',
          outlineClass,
          focusRingClass
        )}
      >
        <Share2 aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
