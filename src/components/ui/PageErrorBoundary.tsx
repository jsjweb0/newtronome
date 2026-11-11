import clsx from 'clsx';
import { RefreshCcw, House, TriangleAlert } from 'lucide-react';
import { Component, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type PageErrorBoundaryProps = {
  children: ReactNode;
}

type PageErrorBoundaryState = {
  hasError: boolean;
}

export default class PageErrorBoundary extends Component<
  PageErrorBoundaryProps,
  PageErrorBoundaryState
> {
  state: PageErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(): PageErrorBoundaryState {
    return {
      hasError: true
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section
          aria-labelledby="page-error-title"
          className="px-4 py-12 md:py-16"
        >
          <div className="mx-auto max-w-110 flex flex-col items-center gap-4 px-5 py-10 md:px-8 md:py-14 rounded-3xl border border-line bg-surface text-center">
            <span
              aria-hidden="true"
              className="flex items-center justify-center size-16 rounded-full bg-amber-400/14 text-amber-500 dark:text-amber-300"
            >
              <TriangleAlert className="size-7" />
            </span>

            <div role="alert" className="flex flex-col gap-2">
              <h2
                id="page-error-title"
                className="text-xl md:text-[22px] font-extrabold text-textBase"
              >
                페이지를 표시하지 못했습니다.
              </h2>
              <p className="text-sm leading-relaxed text-textSub break-keep">
                새로고침해 다시 시도해 주세요.
                <br />
                문제가 계속되면 잠시 후 다시 방문해 주세요.
              </p>
            </div>

            <div className="mt-1 flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className={clsx(
                  'inline-flex items-center gap-2 min-h-12 px-5.5 rounded-full bg-primary text-onPrimary text-[15px] font-extrabold',
                  'hover:bg-primary/85 transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                )}
              >
                <RefreshCcw aria-hidden="true" className="size-4.5" />
                새로고침
              </button>

              <Link to="/"
                className={clsx(
                  'inline-flex items-center gap-2 min-h-12 px-5 rounded-full border border-textThr bg-background text-sm font-bold text-textBase',
                  'hover:border-primary hover:text-primary transition-colors',
                  'focus-visible:border-primary focus-visible:text-primary',
                )}
              >
                <House aria-hidden="true" className="size-4" />
                홈으로 이동
              </Link>
            </div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
