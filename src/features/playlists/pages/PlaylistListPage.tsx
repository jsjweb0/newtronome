import clsx from 'clsx';
import { PLAYLISTS } from '../data/playlists';
import { toHighResArtwork } from '../../../utils/image';
import { ListMusic } from 'lucide-react';
import noImage from '../../../assets/no-image.png';

export default function PlaylistListPage() {
  return (
    <section className="mx-auto w-full px-4 py-4 lg:px-8 lg:py-10">
      <div className="mb-6 pb-4">
        <div className="flex items-center gap-2">
          <ListMusic aria-hidden="true" className="size-5 lg:size-6.5 text-primary" />
          <h2 className="text-lg lg:text-2xl font-bold text-textBase">Playlists</h2>
        </div>
        <p className="mt-1 text-xs lg:text-sm text-textSub">듣고 싶은 플레이리스트를 골라보세요.</p>
        <p className="sr-only">
          플레이리스트를 선택하면 해당 목록의 상세 페이지로 이동합니다.
        </p>
      </div>



      <ul className="grid grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-8 lg:gap-y-14 mt-6 text-center">
        {PLAYLISTS.map((playlist) => (
          <li key={playlist.id} className='max-w-60'>
            <a href={`/playlists/${playlist.id}`} className="group relative flex flex-1 flex-col">
              <span className={clsx(
                "overflow-hidden block relative rounded-lg bg-white",
                "pt-[100%]",
              )}>
                <img
                  src={
                    playlist.coverUrl ? toHighResArtwork(playlist.coverUrl) : noImage
                  }
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = noImage;
                  }}
                  alt='' className={clsx(
                    'block object-cover w-full h-full transition-transform absolute top-0 left-0',
                    'group-hover:scale-110 group-focus-visible:scale-110 group-hover:opacity-80 group-focus-visible:opacity-80',
                  )} />
              </span>
              <span className={clsx(
                "block max-lg:text-sm mt-3",
                "group-hover:text-primary group-focus-visible:text-primary",
              )}>{playlist.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
