import { ITunesTrack } from '../types/itunes.types';
import { useArtistTracks } from '../hooks/useArtistTracks';
import clsx from 'clsx';
import noImage from '../../../assets/no-image.png';
import { PauseRound, PlayRound } from '../../../components/icons';
import { X as XIcon, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';

interface ArtistTracksPanelProps {
  artist: {
    id: number;
    name: string;
  } | null;
  isOpen: boolean;
  isSidebarCollapsed: boolean;
  playingTrackId: number | null;
  onClose: () => void;
  onPreview: (track: ITunesTrack) => Promise<void>;
}

export default function ArtistTracksPanel({
  artist,
  isOpen,
  isSidebarCollapsed,
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
      <DialogPanel
        className={clsx(
          'fixed bottom-22.5 lg:bottom-34 left-3 w-full max-w-[calc(100%-1.5rem)] lg:max-w-sm border',
          'border-textBase/15 backdrop-blur-md rounded-tl-3xl rounded-tr-3xl',
          'transition-[left,transform,opacity] duration-300 ease-out',
          'data-closed:translate-y-4 data-closed:opacity-0',
          isSidebarCollapsed
            ? 'lg:left-25'
            : 'lg:left-66'
        )}
      >
        <div className="flex justify-between items-center py-6 px-6">
          <DialogTitle as="h2" className="font-normal">
            <b className="font-bold">{artist?.name}</b>의 최신곡
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="아티스트 곡 패널 닫기"
            className="rounded-full p-2 hover:bg-gray-500/50 focus-visible:bg-gray-500/50 transition-all"
          >
            <XIcon aria-hidden="true" />
          </button>
        </div>

        <div className="px-6 mb-4">
          {artistTracksQuery.isPending && (
            <div className="flex items-center gap-2">
              <span className="animate-spin inline-block size-4 border-3 border-current border-t-transparent text-primary rounded-full"
                aria-hidden="true"
              >
              </span>
              <p role="status" className="text-textSub">아티스트의 곡을 불러오는 중입니다.</p>
            </div>
          )}

          {artistTracksQuery.isError && (
            <div role="alert">
              <p className="text-textSub">아티스트의 곡을 불러오지 못했습니다.</p>
              <button
                type="button"
                onClick={() =>
                  artistTracksQuery.refetch()
                }
                className="inline-flex items-center gap-2 mt-1 rounded-lg border border-textThr px-3 py-1.5 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
              >
                <RotateCcw className="size-4" aria-hidden="true" /> 다시 시도
              </button>
            </div>
          )}

          {artistTracksQuery.isSuccess &&
            artistTracksQuery.data.length === 0 && (
              <p className="text-textSub">표시할 곡이 없습니다.</p>
            )}

          {artistTracksQuery.isSuccess && artistTracksQuery.data.length > 0 && (
            <ul className="space-y-3">
              {artistTracksQuery.data.map((track) => {
                const isPlaying = playingTrackId === track.trackId;

                const PlaybackIcon = isPlaying ? PauseRound : PlayRound;

                return (
                  <li key={track.trackId}>
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
                      className="group grid grid-cols-[3rem_1fr_30px] grid-rows-2 gap-x-2.5 items-center w-full text-left hover:text-primary focus-visible:text-primary backdrop-blur-3xl"
                    >
                      <span className="row-span-2 overflow-hidden flex relative size-12 rounded-lg">
                        <img
                          src={track.artworkUrl100 || noImage}
                          alt=""
                          className="size-full object-cover"
                          onError={(event) => {
                            event.currentTarget.src = noImage;
                            event.currentTarget.onerror = null;
                          }}
                        />
                      </span>
                      <span
                        className="col-start-2 block w-full text-sm text-textBase truncate group-hover:text-primary group-focus-visible:text-primary"
                      >
                        {track.trackName}
                      </span>
                      <span
                        className="col-start-2 self-start block text-[11px] text-textSub truncate group-hover:text-primary group-focus-visible:text-primary"
                      >
                        {track.artistName}
                      </span>
                      <span
                        aria-hidden="true"
                        className="col-start-3 row-span-2 row-start-1 flex justify-center font-inter text-[11px] font-light text-textSub group-hover:text-primary group-focus-visible:text-primary"
                      >
                        <PlaybackIcon
                          className="fade-in fill-black size-6 lg:size-8 transition-all duration-300 dark:fill-white"
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogPanel>
    </Dialog>
  )
}