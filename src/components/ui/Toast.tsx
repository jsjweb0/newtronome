import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type {
  ToastAction,
  ToastContextValue,
  ToastOptions,
  ToastType,
} from '../../contexts/ToastContext';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
  action?: ToastAction;
  /** 같은 메시지가 다시 오면 증가해서 타이머와 진행 줄을 처음부터 다시 시작 */
  restartCount: number;
}

const MAX_TOASTS = 3;

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  info: 3000,
  warning: 4000,
  error: 5000,
};

// 아이콘 원·진행 줄·액션 버튼은 currentColor로 이 색을 따라감
const TONE_CLASS: Record<ToastType, string> = {
  success: 'text-primary',
  warning: 'text-[#B7791F] dark:text-[#FFB54A]',
  error: 'text-danger dark:text-[#FF6B6B]',
  info: 'text-[#2B6CB0] dark:text-[#7CC4FF]',
};

const iconProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const TYPE_ICON: Record<ToastType, ReactNode> = {
  success: (
    <svg {...iconProps} width={15} height={15}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  warning: (
    <svg {...iconProps}>
      <path d="M12 6v8" />
      <path d="M12 18h.01" />
    </svg>
  ),
  error: (
    <svg {...iconProps} width={15} height={15}>
      <path d="M17 7 7 17M7 7l10 10" />
    </svg>
  ),
  info: (
    <svg {...iconProps}>
      <path d="M12 11v7" />
      <path d="M12 6h.01" />
    </svg>
  ),
};

const isAlertType = (type: ToastType) => type === 'warning' || type === 'error';

interface Announcement {
  /** 같은 메시지를 다시 알려도 새 노드로 바뀌어 다시 낭독되도록 매번 바뀌는 값 */
  key: number;
  message: string;
  isAlert: boolean;
}

// 최신 토스트(맨 아래)에서 멀어질수록 작고 흐리게
const DEPTH_CLASS = ['', 'scale-97 opacity-85', 'scale-94 opacity-70'];

interface ToastCardProps {
  toast: ToastItem;
  depth: number;
  onDismiss: (id: number) => void;
}

function ToastCard({ toast, depth, onDismiss }: ToastCardProps) {
  const { id, message, type, duration, action, restartCount } = toast;
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isPaused = isHovered || isFocused;
  const remainingRef = useRef(duration);

  // 새로 뜨거나 같은 메시지로 다시 시작되면 남은 시간을 처음으로 되돌림
  useEffect(() => {
    remainingRef.current = duration;
  }, [duration, restartCount]);

  // 멈춰 있지 않을 때만 남은 시간만큼 기다렸다 닫고, 멈추면 지난 시간만큼 남은 시간을 줄여 둠
  useEffect(() => {
    if (isPaused) return;

    const startedAt = Date.now();
    const timerId = window.setTimeout(() => onDismiss(id), remainingRef.current);

    return () => {
      window.clearTimeout(timerId);
      remainingRef.current -= Date.now() - startedAt;
    };
  }, [id, isPaused, onDismiss, duration, restartCount]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsFocused(false);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      className={clsx(
        'pointer-events-auto relative flex items-center gap-3 min-h-14 py-2.5 pr-2 pl-3 overflow-hidden rounded-2xl',
        'bg-background/92 dark:bg-background/88 backdrop-blur-[18px] backdrop-saturate-140',
        'border border-black/8 dark:border-white/8',
        'shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)]',
        'origin-bottom transition-[translate,scale,opacity] duration-250 ease-out motion-reduce:transition-none',
        'starting:translate-y-3 starting:opacity-0',
        TONE_CLASS[type],
        DEPTH_CLASS[depth]
      )}
    >
      <span
        aria-hidden="true"
        className="shrink-0 inline-flex items-center justify-center size-7 rounded-full bg-current/16"
      >
        {TYPE_ICON[type]}
      </span>
      <p className="grow min-w-0 text-sm font-medium leading-[1.45] text-textBase break-keep">
        {message}
      </p>
      {action && (
        <Link
          to={action.to}
          onClick={() => onDismiss(id)}
          className="shrink-0 inline-flex items-center min-h-9 px-3 rounded-full bg-current/16 text-[13px] font-bold hover:bg-current/24 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          {action.label}
        </Link>
      )}
      <button
        type="button"
        aria-label="알림 닫기"
        onClick={() => onDismiss(id)}
        className="shrink-0 inline-flex items-center justify-center size-8 rounded-full text-textSub hover:text-textBase hover:bg-black/6 dark:hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
      <span
        key={restartCount}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-current/70 animate-toast-progress motion-reduce:hidden"
        style={{
          animationDuration: `${duration}ms`,
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      />
    </div>
  );
}

const Toast = forwardRef<ToastContextValue>(function Toast(_, ref) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // 낭독 영역에 넣을 마지막 메시지. 화면의 카드와 따로 두어 영역을 미리 렌더링해 둠
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const nextIdRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, type = 'success', duration, action }: ToastOptions) => {
      const nextFields = {
        message,
        type,
        duration: duration ?? DEFAULT_DURATION[type],
        action,
      };
      nextIdRef.current += 1;
      const id = nextIdRef.current;

      setAnnouncement({ key: id, message, isAlert: isAlertType(type) });
      setToasts((prev) => {
        const sameToast = prev.find((toast) => toast.message === message);

        if (sameToast) {
          return prev.map((toast) =>
            toast.id === sameToast.id
              ? { ...toast, ...nextFields, restartCount: toast.restartCount + 1 }
              : toast
          );
        }

        const newToast: ToastItem = { id, ...nextFields, restartCount: 0 };

        return [...prev, newToast].slice(-MAX_TOASTS);
      });
    },
    []
  );

  useImperativeHandle(ref, () => ({ showToast }), [showToast]);

  // 토스트가 모두 닫히면 낭독 영역도 비워서 지난 메시지가 남지 않게 함
  const liveMessage = toasts.length > 0 ? announcement : null;

  return (
    <>
      {/* 메시지가 생기기 전부터 있어야 스크린 리더가 바뀐 내용을 읽어 줌 */}
      <div role="status" aria-live="polite" className="sr-only">
        {liveMessage && !liveMessage.isAlert && <p key={liveMessage.key}>{liveMessage.message}</p>}
      </div>
      <div role="alert" className="sr-only">
        {liveMessage?.isAlert && <p key={liveMessage.key}>{liveMessage.message}</p>}
      </div>
      {toasts.length > 0 && (
        <section
          aria-label="알림 메시지"
          className={clsx(
            'pointer-events-none fixed z-700 left-3 right-3 bottom-24 flex flex-col gap-2',
            'sm:left-auto sm:w-95 xl:bottom-35',
            // 오른쪽 플레이리스트 패널(300px)이 열려 있으면 패널 왼쪽에 붙임
            'lg:[:root:has(#playlist-panel[data-state=open])_&]:right-[calc(300px+1.5rem)]'
          )}
        >
          {toasts.map((toast, index) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              depth={toasts.length - 1 - index}
              onDismiss={dismissToast}
            />
          ))}
        </section>
      )}
    </>
  );
});

export default Toast;
