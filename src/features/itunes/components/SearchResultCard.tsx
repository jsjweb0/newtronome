import clsx from "clsx";
import { ChevronRight, Pause, Play } from "lucide-react";
import type { ITunesTrack } from "../types/itunes.types";
import ExternalLink from "../../../components/ui/ExternalLink";
import noImage from '../../../assets/no-image.png';
import appleMusicBadge from '../../../assets/brands/apple-music-listen-badge-2x.png';

const getLargeArtworkUrl = (artworkUrl: string) =>
  artworkUrl.replace('100x100bb', '600x600bb');

interface SearchResultCardProps {
  track: ITunesTrack;
  isPlayingPreview: boolean;
  onPreview: (track: ITunesTrack) => void;
  onOpenArtist: (track: ITunesTrack) => void;
}

export default function SearchResultCard({
  track,
  isPlayingPreview,
  onPreview,
  onOpenArtist,
}: SearchResultCardProps) {
  const artworkUrl = track.artworkUrl100
    ? getLargeArtworkUrl(track.artworkUrl100)
    : noImage;

  return (
    <article className="group flex min-w-0 flex-col gap-2.5">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-textThr">
        <img
          src={artworkUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.src = noImage;
            event.currentTarget.onerror = null;
          }}
        />

        {isPlayingPreview && (
          <span className="absolute top-2.5 left-2.5 z-1 rounded-full bg-black/72 px-2.5 py-1 text-[11px] font-bold text-primary">
            30초 미리듣기 중
          </span>
        )}

        {track.previewUrl && (
          <button
            type="button"
            onClick={() => onPreview(track)}
            aria-label={
              isPlayingPreview
                ? `${track.trackName} 미리듣기 정지`
                : `${track.trackName} 30초 미리듣기`
            }
            className={clsx(
              'absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity duration-150',
              'focus-visible:opacity-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
              isPlayingPreview ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <span className="flex size-12 md:size-14 items-center justify-center rounded-full bg-white text-black shadow-lg">
              {isPlayingPreview ? (
                <Pause aria-hidden="true" className="size-5 md:size-6 fill-current" />
              ) : (
                <Play aria-hidden="true" className="ml-0.5 size-5 md:size-6 fill-current" />
              )}
            </span>
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <p
          className={clsx(
            'truncate text-sm md:text-[15px] font-bold',
            isPlayingPreview ? 'text-primary' : 'text-textBase'
          )}
        >
          {track.trackName}
        </p>
        <p className="truncate text-xs md:text-[13px] text-textSub">{track.artistName}</p>
      </div>

      <div className="flex flex-wrap items-center gap-x-2.5">
        {track.trackViewUrl && (
          <ExternalLink
            href={track.trackViewUrl}
            label={`${track.trackName} Apple Music에서 보기`}
            title="Apple Music에서 보기 (새 창)"
            className="inline-flex min-h-11 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
          >
            <img src={appleMusicBadge} alt="" className="h-8 md:h-9 w-auto" />
          </ExternalLink>
        )}
        <button
          type="button"
          onClick={() => onOpenArtist(track)}
          aria-haspopup="dialog"
          aria-label={`${track.artistName} 다른 곡 보기`}
          className="inline-flex min-h-11 items-center gap-0.5 rounded-md px-1 text-xs md:text-[13px] text-textSub hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        >
          다른 곡 보기
          <ChevronRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </article>
  );
}
