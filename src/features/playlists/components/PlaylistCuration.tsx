import { LogoMoIcon } from '../../../components/icons';

interface PlaylistCurationProps {
  /** YYYY-MM-DD. 없으면 날짜 부분만 숨김 */
  updatedAt?: string;
}

const formatUpdatedAt = (value?: string) => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
};

/** 상세 상단 큐레이션 줄: (로고) newtronome 큐레이션 · YYYY.MM.DD 업데이트 */
export default function PlaylistCuration({ updatedAt }: PlaylistCurationProps) {
  const dateLabel = formatUpdatedAt(updatedAt);

  return (
    <p className="flex items-center gap-2.5 text-sm text-textSub">
      {/* 라이트 모드에서도 검정 원 유지 */}
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center justify-center size-7 rounded-full bg-black border border-white/10 text-primary"
      >
        <LogoMoIcon aria-hidden="true" className="w-3.5 h-[13px]" />
      </span>
      <span>
        <strong className="font-bold text-textBase">newtronome</strong> 큐레이션
        {dateLabel && (
          <>
            {' · '}
            <time dateTime={updatedAt}>{dateLabel}</time> 업데이트
          </>
        )}
      </span>
    </p>
  );
}
