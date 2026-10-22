import clsx from 'clsx';
import { RefreshCcw, House } from 'lucide-react';
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
          className="mx-auto max-w-lg px-4 py-16 text-center"
        >
          <div role="alert">
            <h2
              id="page-error-title"
              className="text-lg font-semibold text-textBase"
            >
              페이지를 표시하지 못했습니다.
            </h2>
            <p className="mt-3 text-sm text-textSub">
              새로고침해 다시 시도해 주세요.
              문제가 계속되면 잠시 후 다시 방문해 주세요.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className={clsx(
                'inline-flex gap-2 items-center mt-3 px-4 py-2 border border-textThr rounded-lg',
                'max-md:text-sm',
                'hover:border-primary hover:text-primary',
                'focus-visible:border-primary focus-visible:text-primary',
                'disabled:opacity-50 disabled:pointer-events-none',
              )}
            >
              <RefreshCcw aria-hidden="true" className="size-4" />
              새로고침
            </button>

            <Link to="/"
              className={clsx(
                'inline-flex gap-2 items-center mt-3 px-4 py-2 border border-textThr rounded-lg',
                'max-md:text-sm',
                'hover:border-primary hover:text-primary',
                'focus-visible:border-primary focus-visible:text-primary',
                'disabled:opacity-50 disabled:pointer-events-none',
              )}
            >
              <House aria-hidden="true" className="size-4" />
              홈으로 이동
            </Link>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}