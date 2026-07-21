import { toHighResArtwork } from '../../utils/image.js';
import { formatTime } from '../../utils/format.js';
import HeaderButtons from '../layout/HeaderButtons.jsx';
import LikeButton from '../ui/LikeButton.jsx';
import { AudioEqualizerIcon } from '../icons/index.js';
import { Link as LinkIcon, ListMusic, Play } from 'lucide-react';
import noImage from '../../assets/no-image.png';
import clsx from 'clsx';
import SoundCloudWidget from '../../features/player/components/SoundCloudWidget.jsx';

export default function PlaylistPanel({
  playlistUrl,
  tracks,
  onSelect,
  collapsed,
  isPlaying,
  soundCloudWidget,
}) {
  const widgetTrack = soundCloudWidget.widgetTrack;
  const playlistTrack =
    tracks.find((track) => String(track.id) === String(widgetTrack?.id)) ?? widgetTrack;
  const genre = playlistTrack?.genre?.trim() ?? '';
  const tags = (playlistTrack?.tags ?? []).filter((tag, index, tagList) => {
    const normalizedTag = tag.trim().toLowerCase();

    return (
      normalizedTag &&
      normalizedTag !== genre.toLowerCase() &&
      tagList.findIndex((item) => item.trim().toLowerCase() === normalizedTag) === index
    );
  });

  return (
    <aside
      className={clsx(
        'z-51 fixed top-0 lg:top-3 right-0 lg:right-3 h-full xl:max-h-[calc(100%-116px-2.25rem)] transform transition-transform duration-300 w-full max-w-md lg:max-w-[300px] rounded-2xl',
        collapsed ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className={`flex flex-col gap-3 h-full ${collapsed ? '' : 'hidden'}`}>
        <div
          className={clsx(
            'hidden lg:block shrink-0 z-2 relative px-4 py-2 bg-background rounded-2xl transition-transform transition-duration-350',
            'border border-textThr dark:border-none',
            collapsed ? 'translate-x-0' : 'translate-x-[calc(100%-4.5rem)]'
          )}
        >
          <HeaderButtons collapsed={collapsed} />
        </div>
        <div
          className={clsx(
            'overflow-y-auto grow relative bg-background rounded-2xl scrollbar transition-all transition-duration-600',
            'max-xl:pb-28',
            'border border-textThr dark:border-none',
            collapsed ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          )}
        >
          <h3 className="text-lg font-semibold text-textBase mb-4 sr-only">Now Playing</h3>

          {/* top cover*/}
          <div className="flex flex-col gap-y-1 p-4">
            <div>
              <img
                src={toHighResArtwork(playlistTrack?.artworkUrl)}
                alt={playlistTrack?.title || '플레이리스트 트랙'}
                className="w-full rounded-2xl object-cover"
                onError={(e) => {
                  e.target.src = noImage;
                  e.target.onerror = null;
                }}
              />
            </div>
            {genre && <div className="mt-4 text-xs text-textSub">{genre}</div>}
            {playlistTrack?.permalinkUrl ? (
              <a
                href={playlistTrack.permalinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${playlistTrack.title} 원곡을 SoundCloud에서 열기 (새 창)`}
                className="flex gap-1.5 items-center mt-4 text-lg font-black leading-6 hover:text-primary"
              >
                {playlistTrack.title}
                <LinkIcon className="size-3.5 shrink-0" />
              </a>
            ) : (
              <div className="mt-4 text-lg font-black leading-6">{playlistTrack?.title}</div>
            )}
            <div className="mt-1">{playlistTrack?.artist}</div>
            <div className="flex items-center gap-x-2 mt-4 text-xs text-textSub">
              <LikeButton
                docId={String(playlistTrack?.id)}
                collection="tracks"
                className="size-8 rounded-lg border border-textThr dark:border-none dark:bg-textThr mr-2 text-textBase"
              />
              Likes
              <Play className="size-3 fill-textBase stroke-none" />
              {formatTime(playlistTrack?.durationMs)}
            </div>
            {tags.length > 0 && (
              <ul className="flex flex-wrap gap-2 mt-3" aria-label="현재 재생곡 태그">
                {tags.slice(0, 5).map((tag) => (
                  <li key={tag}>
                    <a
                      href={`https://soundcloud.com/search?q=${encodeURIComponent(tag)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-2 py-1 text-xs rounded-full bg-textThr text-textSub hover:text-primary hover:bg-primary/6"
                      aria-label={`SoundCloud에서 ${tag} 태그 검색 (새 창)`}
                    >
                      # {tag}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* widget */}
          <div
            className="absolute size-px overflow-hidden opacity-0 pointer-events-none"
            aria-hidden="true"
          >
            <SoundCloudWidget playlistUrl={playlistUrl} controller={soundCloudWidget} />
          </div>
          {/* // widget */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-b-textThr">
              <h4 className="font-semibold">All Playlists</h4>
              <ListMusic className="size-5.5" />
            </div>
            <ol className="space-y-4">
              {tracks.length > 0 ? (
                tracks.map((track, index) => {
                  const isActive = track.id === playlistTrack?.id;

                  return (
                    <li key={track.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (isActive) {
                            soundCloudWidget.toggle();
                            return;
                          }

                          onSelect(index);
                        }}
                        aria-label={`${track.title} ${isActive && isPlaying ? '일시정지' : '재생'}`}
                        className={clsx(
                          'group grid grid-cols-[3rem_1fr_30px] grid-rows-2 gap-x-2.5 items-center w-full text-left hover:text-primary',
                          isActive && 'text-primary'
                        )}
                      >
                        <span className="row-span-2 overflow-hidden flex relative size-12 rounded-lg">
                          <img
                            src={toHighResArtwork(track.artworkUrl)}
                            alt=""
                            className="size-full object-cover"
                            onError={(event) => {
                              event.currentTarget.src = noImage;
                              event.currentTarget.onerror = null;
                            }}
                          />
                          {isActive && (
                            <i className="flex justify-center items-center absolute inset-0 bg-primary/45">
                              <AudioEqualizerIcon isPlaying={isPlaying} className="text-white" />
                            </i>
                          )}
                        </span>
                        <span
                          className={clsx(
                            'col-start-2 block w-full text-sm text-textBase truncate group-hover:text-primary',
                            isActive && 'text-primary!'
                          )}
                        >
                          {track.title}
                        </span>
                        <span
                          className={clsx(
                            'col-start-2 block text-[11px] text-textSub truncate group-hover:text-primary',
                            isActive && 'text-primary!'
                          )}
                        >
                          {track.artist}
                        </span>
                        <span
                          className={clsx(
                            'col-start-3 row-span-2 row-start-1 flex justify-center font-inter text-[11px] font-light text-textSub group-hover:text-primary',
                            isActive && 'text-primary!'
                          )}
                        >
                          {formatTime(track.durationMs)}
                        </span>
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className="text-sm text-gray-500">플레이리스트가 비어 있어요</li>
              )}
            </ol>
          </div>
        </div>
      </div>
    </aside>
  );
}
