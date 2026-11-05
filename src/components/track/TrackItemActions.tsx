import TrackBookmarkButton from '../../features/bookmarks/components/TrackBookmarkButton';
import ExternalLink from '../ui/ExternalLink';
import type { PlayerTrack } from '../../features/player/types/player.types';
import soundCloudFaviconBlack from '../../assets/brands/soundcloud-favicon-black.webp';
import soundCloudFaviconWhite from '../../assets/brands/soundcloud-favicon-white.webp';

type TrackItemActionsProps = {
  track: PlayerTrack;
};

/** 트랙 행/카드에서 쓰는 좋아요 버튼 크기 (좋아요 페이지의 저장 해제 버튼도 같은 크기) */
export const trackActionButtonClass =
  'inline-flex items-center justify-center size-10 md:size-11 rounded-full hover:bg-textSub/10';

/** SoundCloud 원곡 링크 (항상 새 창, 미디어킷 규칙에 맞는 로고) */
export function SoundCloudTrackLink({ track }: TrackItemActionsProps) {
  if (!track.permalinkUrl) return null;

  return (
    <ExternalLink
      href={track.permalinkUrl}
      label={`${track.title} 원곡을 SoundCloud에서 열기`}
      title="SoundCloud에서 듣기 (새 창)"
      className="inline-flex items-center justify-center w-13 md:w-16 h-11 rounded-[10px] hover:bg-textSub/10"
    >
      {/* 미디어킷 규칙: 밝은 배경엔 검정, 어두운 배경엔 흰색 로고 (최소 48px) */}
      <img src={soundCloudFaviconBlack} alt="" className="h-[22px] w-auto dark:hidden" />
      <img src={soundCloudFaviconWhite} alt="" className="hidden h-[22px] w-auto dark:block" />
    </ExternalLink>
  );
}

/** 트랙 행/카드 오른쪽의 좋아요 · SoundCloud 링크 */
export default function TrackItemActions({ track }: TrackItemActionsProps) {
  return (
    <>
      <TrackBookmarkButton
        track={track}
        className={`${trackActionButtonClass} text-textSub hover:text-textBase`}
        iconClassName="size-[18px]"
      />
      <SoundCloudTrackLink track={track} />
    </>
  );
}
