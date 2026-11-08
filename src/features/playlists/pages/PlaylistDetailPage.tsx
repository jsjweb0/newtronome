import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ExternalLink as ExternalLinkIcon, ListMusic } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import ExternalLink from '../../../components/ui/ExternalLink';
import PlaylistCoverArt from '../components/PlaylistCoverArt';
import { findPlaylistById } from '../data/playlists';

const focusRingClass =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

function BackToListLink() {
  return (
    <Link
      to={ROUTES.playlists.path}
      className={`inline-flex items-center gap-1 min-h-11 -ml-1.5 pr-3 pl-1 rounded-full text-sm text-textSub hover:text-primary transition-colors ${focusRingClass}`}
    >
      <ChevronLeft aria-hidden="true" className="size-5" />
      목록으로
    </Link>
  );
}

export default function PlaylistDetailPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  // URL id로 카탈로그를 바로 조회해서 새로고침 · 직접 접근에도 같은 화면을 보여 줌
  const playlist = findPlaylistById(playlistId);

  if (!playlist) {
    return (
      <section className="mx-auto w-full px-1 md:px-7 pb-6 lg:pb-10">
        <div className="flex flex-col items-center gap-2.5 px-4 pt-14 pb-10 text-center">
          <ListMusic aria-hidden="true" className="size-10 text-textSub" />
          <h1 className="text-lg md:text-[22px] font-bold text-textBase">
            플레이리스트를 찾을 수 없습니다
          </h1>
          <p className="text-sm text-textSub">주소가 바뀌었거나 없는 플레이리스트예요.</p>
          <Link
            to={ROUTES.playlists.path}
            className={`mt-4 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-7 text-[15px] font-extrabold text-onPrimary hover:bg-primary/85 transition-colors ${focusRingClass}`}
          >
            플레이리스트 목록 보기
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="playlist-detail-title"
      className="mx-auto w-full px-1 md:px-7 pb-6 lg:pb-10"
    >
      <BackToListLink />

      <div className="flex max-md:flex-col md:items-end gap-6 md:gap-10 mt-4 md:mt-6">
        <div className="relative shrink-0 w-full max-w-[320px] md:w-60 lg:w-72 aspect-square overflow-hidden rounded-xl bg-textThr shadow-[0_10px_24px_rgba(0,0,0,0.25)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
          <PlaylistCoverArt
            playlist={playlist}
            loading="eager"
            titleClassName="text-2xl md:text-3xl"
          />
        </div>

        <div className="flex min-w-0 flex-col items-start gap-y-4">
          <span className="inline-block px-2.5 py-1 rounded-full bg-primary text-onPrimary font-inter text-[11px] font-extrabold tracking-[0.1em]">
            PLAYLIST
          </span>
          <h1
            id="playlist-detail-title"
            className="text-[32px] md:text-[44px] leading-tight font-extrabold tracking-tight text-textBase break-keep"
          >
            {playlist.title}
          </h1>
          <p className="font-inter text-xs font-black italic tracking-[0.02em] text-textSub">
            NEWTRONOME
          </p>
          <ExternalLink
            href={playlist.soundCloudUrl}
            label={`${playlist.title} SoundCloud에서 열기`}
            className={`inline-flex items-center gap-2 min-h-11 px-5 rounded-xl bg-field border border-textThr dark:border-line text-sm font-bold text-textBase hover:border-primary hover:text-primary transition-colors ${focusRingClass}`}
          >
            SoundCloud에서 열기
            <ExternalLinkIcon aria-hidden="true" className="size-4" />
          </ExternalLink>
        </div>
      </div>
    </section>
  );
}
