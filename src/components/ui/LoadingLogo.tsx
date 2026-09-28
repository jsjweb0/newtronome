import LogoIcon from '../icons/Logo';

function LoadingLogo() {
  return (
    <div
      role="status"
      className="flex min-h-[60vh] items-center justify-center bg-background"
    >
      <div className="relative w-64 max-w-[80vw] sm:w-80" aria-hidden="true">
        <LogoIcon className="h-auto w-full text-textThr" />
        <LogoIcon className="logo-fill absolute inset-0 h-auto w-full text-primary" />
      </div>
      <span className="sr-only">페이지를 불러오는 중입니다.</span>
    </div>
  );
}

export default LoadingLogo;
