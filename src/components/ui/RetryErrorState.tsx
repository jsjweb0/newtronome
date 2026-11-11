import clsx from 'clsx';
import { CloudOff, RotateCcw } from 'lucide-react';

type RetryErrorStateProps = {
  message?: string;
  onRetry: () => void;
  isRetrying?: boolean;
  /** 메시지 아래 보조 설명 (compact에서는 표시하지 않음) */
  description?: string;
  /** compact: 댓글·패널·기존 목록 위 안내처럼 좁은 곳에 쓰는 작은 크기 */
  size?: 'default' | 'compact';
};

export default function RetryErrorState({
  message = '데이터를 불러오지 못했습니다.',
  onRetry,
  isRetrying = false,
  description = '네트워크 상태를 확인하고 다시 시도해 주세요.',
  size = 'default',
}: RetryErrorStateProps) {
  const isCompact = size === 'compact';

  return (
    <div
      className={clsx(
        'flex flex-col items-center text-center',
        isCompact ? 'gap-2.5 px-3 py-6' : 'gap-3.5 px-4 py-12'
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'flex items-center justify-center rounded-full bg-textThr/60 text-textSub',
          isCompact ? 'size-11' : 'size-14'
        )}
      >
        <CloudOff className={isCompact ? 'size-5' : 'size-6'} />
      </span>

      <p
        role="alert"
        className={clsx(
          'font-bold text-textBase break-keep',
          isCompact ? 'text-sm' : 'text-[15px]'
        )}
      >
        {message}
      </p>

      {!isCompact && description && (
        <p className="-mt-1.5 text-[13px] text-textSub break-keep">{description}</p>
      )}

      <button
        type="button"
        className={clsx(
          'inline-flex items-center gap-2 min-h-11 px-4.5 rounded-full border border-textThr bg-background',
          'text-sm font-bold text-textBase transition-colors',
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
