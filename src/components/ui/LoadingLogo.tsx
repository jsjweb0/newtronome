import LogoIcon from '../icons/Logo';

function LoadingLogo() {
  return (
    <div
      role="status"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4.5"
    >
      {/* 회색 로고 위로 민트가 채워지고, 빛이 한 번 스쳐 지나감 */}
      <div className="relative w-55 max-w-[70vw] overflow-hidden" aria-hidden="true">
        <LogoIcon className="h-auto w-full text-textThr" />
        <LogoIcon className="logo-fill absolute inset-0 h-auto w-full text-primary" />
        <span className="logo-sheen pointer-events-none absolute -inset-y-2.5 left-0 w-1/3 bg-linear-to-r from-transparent via-white/35 to-transparent mix-blend-overlay" />
      </div>

      <div
        className="flex items-center gap-2.5 font-inter text-xs font-bold tracking-[0.08em] text-textSub"
        aria-hidden="true"
      >
        <span className="loading-eq flex h-4.5 items-end gap-1">
          <span />
          <span />
          <span />
          <span />
          <span />
        </span>
        <span>
          LOADING
          <span className="loading-dots">
            <i>.</i>
            <i>.</i>
            <i>.</i>
          </span>
        </span>
      </div>

      <span className="sr-only">페이지를 불러오는 중입니다.</span>
    </div>
  );
}

export default LoadingLogo;
