import { ITunesTrack } from '../types/itunes.types';
import { useArtistTracks } from '../hooks/useArtistTracks';
import clsx from 'clsx';
import noImage from '../../../assets/no-image.png';
import { ArrowUpRight, Pause, Play, X as XIcon, RotateCcw } from "lucide-react";
import ExternalLink from '../../../components/ui/ExternalLink';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';

interface ArtistTracksPanelProps {
  artist: {
    id: number;
    name: string;
  } | null;
  isOpen: boolean;
  playingTrackId: number | null;
  onClose: () => void;
  onPreview: (track: ITunesTrack) => Promise<void>;
}

/**
 * "다른 곡 보기" 레이어 팝업. 데스크톱은 가운데 팝업, 모바일은 바텀시트.
 * Headless UI Dialog가 포커스 가두기와 ESC 닫기를 맡는다.
 */
export default function ArtistTracksPanel({
  artist,
  isOpen,
  playingTrackId,
  onClose,
  onPreview,
}: ArtistTracksPanelProps) {
  const artistTracksQuery = useArtistTracks(
    artist?.id ?? null
  );

  return (
    <Dialog
      open={isOpen}
      onClose={() => onClose()}
      className="relative z-110"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition-opacity duration-200 ease-out data-closed:opacity-0"
      />

      <div className="fixed inset-0 flex items-end justify-center lg:items-start lg:px-6 lg:pt-40">
        <DialogPanel
          transition
          className={clsx(
            'w-full lg:max-w-110 max-h-[85dvh] overflow-y-auto',
            'rounded-t-[20px] lg:rounded-[18px] px-4 pt-5 pb-7 lg:pb-3.5',
            'bg-white/75 dark:bg-neutral-900/70 backdrop-blur-xl backdrop-saturate-150',
            'border border-black/10 dark:border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.5)]',
            'transition duration-300 ease-out',
            'data-closed:translate-y-6 data-closed:opacity-0'
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-textBase/10 px-1 pb-3">
            <div className="min-w-0">
              <p className="text-xs text-textSub">아티스트 최신곡 5</p>
              <DialogTitle as="h2" className="mt-0.5 truncate text-xl font-bold text-textBase">
                {artist?.name}
                <span className="sr-only">의 최신곡</span>
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={onClose}
              data-autofocus
              aria-label="아티스트 곡 패널 닫기"
              className="-mt-1.5 -mr-1 flex size-11 shrink-0 items-center justify-center rounded-full text-textSub hover:bg-textBase/10 hover:text-textBase focus-visible:outline-2 focus-visible:outline-primary"
            >
              <XIcon aria-hidden="true" className="size-5" />
            </button>
          </div>

          <div className="pt-1.5">
            {artistTracksQuery.isPending && (
              <div className="flex min-h-16 items-center gap-2 px-1">
                <span className="animate-spin inline-block size-4 border-3 border-current border-t-transparent text-primary rounded-full"
                  aria-hidden="true"
                >
                </span>
                <p role="status" className="text-sm text-textSub">아티스트의 곡을 불러오는 중입니다.</p>
              </div>
            )}

            {artistTracksQuery.isError && (
              <div role="alert" className="px-1 py-3">
                <p className="text-sm text-textSub">아티스트의 곡을 불러오지 못했습니다.</p>
                <button
                  type="button"
                  onClick={() =>
                    artistTracksQuery.refetch()
                  }
                  className="inline-flex min-h-11 items-center gap-2 mt-2 rounded-lg border border-textBase/15 px-3 text-sm hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <RotateCcw className="size-4" aria-hidden="true" /> 다시 시도
                </button>
              </div>
            )}

            {artistTracksQuery.isSuccess &&
              artistTracksQuery.data.length === 0 && (
                <p className="px-1 py-4 text-sm text-textSub">표시할 곡이 없습니다.</p>
              )}

            {artistTracksQuery.isSuccess && artistTracksQuery.data.length > 0 && (
              <>
                <ol>
                  {artistTracksQuery.data.map((track) => {
                    const isPlaying = playingTrackId === track.trackId;
                    const PlaybackIcon = isPlaying ? Pause : Play;

                    return (
                      <li
                        key={track.trackId}
                        className="grid min-h-16 grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] px-1 hover:bg-textBase/5"
                      >
                        <button
                          type="button"
                          onClick={() => onPreview(track)}
                          disabled={!track.previewUrl}
                          aria-label={
                            !track.previewUrl
                              ? `${track.trackName} 미리듣기 없음`
                              : isPlaying
                                ? `${track.trackName} 미리듣기 정지`
                                : `${track.trackName} 미리듣기 재생`
                          }
                          className="relative size-12 overflow-hidden rounded-lg disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          <img
                            src={track.artworkUrl100 || noImage}
                            alt=""
                            className="size-full object-cover"
                            onError={(event) => {
                              event.currentTarget.src = noImage;
                              event.currentTarget.onerror = null;
                            }}
                          />
                          {track.previewUrl && (
                            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
                              <PlaybackIcon className="size-4.5 fill-current" />
                            </span>
                          )}
                        </button>

                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span
                            className={clsx(
                              'truncate text-sm font-bold',
                              isPlaying ? 'text-primary' : 'text-textBase'
                            )}
                          >
                            {track.trackName}
                          </span>
                          <span className="truncate text-xs text-textSub">
                            {track.collectionName ?? track.artistName}
                          </span>
                        </div>

                        {track.trackViewUrl ? (
                          <ExternalLink
                            href={track.trackViewUrl}
                            label={`${track.trackName} Apple Music에서 보기`}
                            className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-full border border-textBase/15 px-2.5 text-xs font-bold text-textBase hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
                          >
                            Apple Music
                            <ArrowUpRight aria-hidden="true" className="size-3.5 text-textSub" />
                          </ExternalLink>
                        ) : <span />}
                      </li>
                    );
                  })}
                </ol>
                <p className="mx-1 mt-2 text-[11px] text-textSub">커버를 누르면 30초 미리듣기</p>
              </>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
