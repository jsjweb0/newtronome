import clsx from 'clsx';
import { RotateCcw } from 'lucide-react';

type RetryErrorStateProps = {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
};

export default function RetryErrorState({
  message = '데이터를 불러오지 못했습니다.',
  onRetry,
  isRetrying = false,
}: RetryErrorStateProps) {
  return (
    <div className="my-8 text-center text-textSub text-sm">
      <p role="alert">
        {message}
      </p>

      <button
        type="button"
        className={clsx(
          'inline-flex gap-2 items-center mt-3 px-4 py-2 border border-textThr rounded-lg',
          'hover:border-primary hover:text-primary',
          'focus-visible:border-primary focus-visible:text-primary',
          'disabled:opacity-50 disabled:pointer-events-none',
        )}
        disabled={isRetrying}
        onClick={onRetry}
      >
        <RotateCcw
          className={clsx(
            'size-4',
            isRetrying && 'animate-spin',
          )}
          aria-hidden="true"
        />

        {isRetrying
          ? '다시 불러오는 중…'
          : '다시 시도'}
      </button>
    </div>
  );
}
