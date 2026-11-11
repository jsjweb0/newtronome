import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CircleDot,
  X as CloseIcon,
  Ellipsis,
  Info,
  Trash2,
  TriangleAlert,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useNotifications, type NotificationType } from '../../contexts/NotificationContext';
import Tooltip from './Tooltip';
import clsx from 'clsx';
import { LogoMoIcon } from '../icons';
import { formatRelativeTime } from '../../utils/format';

// 아이콘 칩은 알림 종류(n.type)에 따라 색만 바뀜. 종류가 없으면 info 색
const TONE_CLASS: Record<NotificationType, string> = {
  success: 'bg-primary/14 text-primary',
  warning: 'bg-[#B7791F]/14 text-[#B7791F] dark:bg-[#FFB54A]/14 dark:text-[#FFB54A]',
  error: 'bg-danger/14 text-danger',
  info: 'bg-[#2B6CB0]/14 text-[#2B6CB0] dark:bg-[#7CC4FF]/14 dark:text-[#7CC4FF]',
};

// 종류가 없는 알림은 기존 로고 아이콘을 그대로 씀
const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  success: Check,
  warning: TriangleAlert,
  error: X,
  info: Info,
};

type NotificationDropdownProps = {
  collapsed?: boolean;
}

export default function NotificationDropdown({ collapsed = false, }: NotificationDropdownProps) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [openDropdownId, setOpenDropdownId] =
    useState<number | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const {
    notifications,
    removeNotification,
    clearNotifications,
    toggleRead,
    markRead,
    markAllRead,
  } = useNotifications();
  const containerRef = useRef<HTMLUListElement | null>(null);
  const itemRefs = useRef<Record<number, HTMLLIElement | null>>({});
  const seen = useRef<Set<number>>(new Set());
  // 상대 시간 계산 기준 시각. 열 때 갱신하고, 열려 있는 동안 1분마다 갱신
  const [now, setNow] = useState(() => Date.now());

  const perPage = 10;
  const [visibleCount, setVisibleCount] = useState(perPage);
  const currentList = useMemo(
    () => notifications.slice(0, visibleCount),
    [notifications, visibleCount]
  );
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setOpen(false);
    setOpenDropdownId(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!collapsed) {
      setOpen(false);
      setOpenDropdownId(null);
    }
  }, [collapsed]);

  useEffect(() => {
    if (!open) return;
    const timerId = window.setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => window.clearInterval(timerId);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {

          if (!(entry.target instanceof HTMLElement)) return;

          const id = Number(entry.target.dataset.id);
          if (!Number.isFinite(id)) return;

          const hasSeen = seen.current.has(id);

          // 읽지 않은 경우에만 ‘읽음’ 처리
          const n = notifications.find((x) => x.id === id);

          // 1) 화면에 처음 들어왔을 때만 기록
          if (entry.isIntersecting && !hasSeen) {
            seen.current.add(id);
          }
          // 2) 한 번 들어왔다가 완전히 나갈 때 읽음 처리
          else if (notifications.length > 5 && !entry.isIntersecting && hasSeen) {
            if (n && !n.read) {
              markRead(id);
              observer.unobserve(entry.target);
            }
          }
        });
      },
      {
        root: containerRef.current,
        threshold: [0, 1],
      }
    );

    currentList.forEach((n) => {
      const el = itemRefs.current[n.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [open, currentList, notifications, markRead]);

  const startClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      if (notifications.length < perPage) markAllRead();

      setIsClosing(false);
      setOpen(false);
      setOpenDropdownId(null);
    }, 200);
  }, [markAllRead, notifications.length]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        startClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, startClose]);

  return (
    <div className="relative">
      <div className="flex items-center">
        <Tooltip content="알림" position="bottom">
          <button
            type="button"
            className={clsx(
              'relative inline-flex justify-center items-center size-11 max-lg:pt-px rounded-full lg:hover:text-primary lg:hover:bg-primary/6',
              open && 'bg-primary/12 lg:hover:bg-primary/12 text-primary'
            )}
            onClick={() => {
              if (!open) setNow(Date.now());
              setOpen((prev) => {
                const next = !prev;
                if (!next) setOpenDropdownId(null);
                return next;
              });
            }}
            aria-label={`알림${unreadCount > 0 ? `, 읽지 않은 알림 ${unreadCount}개` : ''}`}
            aria-expanded={open}
            aria-controls="notification-panel"
          >
            {unreadCount > 0 && (
              <span
                className={clsx(
                  'absolute top-3 lg:top-1.5 inset-e-2.5 lg:inset-e-1 inline-flex items-center justify-center py-0.5 px-1 lg:py-1 lg:px-1.5 rounded-full text-[10px] lg:text-xs font-extrabold text-onPrimary bg-primary ring-2 ring-background leading-none',
                  'transform -translate-y-1/2 translate-x-1/2'
                )}
                aria-hidden="true"
              >
                {unreadCount}
              </span>
            )}
            <Bell className="shrink-0 size-5" aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      {(open || isClosing) && (
        <div
          id="notification-panel"
          ref={dropdownRef}
          role="region"
          aria-label="알림 목록"
          className={clsx(
            'z-300 fixed sm:absolute right-3 lg:right-0 mt-0.5 lg:mt-2 w-[calc(100%-1.5em)] sm:w-[392px]',
            'flex flex-col overflow-hidden rounded-[18px] border border-black/8 dark:border-white/8',
            'bg-background/85 dark:bg-[#181818]/72 backdrop-blur-[20px] backdrop-saturate-140',
            'shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.55)]',
            open && !isClosing && 'animate-fade-in',
            isClosing && 'animate-fade-out'
          )}
        >
          <div className="flex justify-between items-center gap-2 pt-4 pb-3 pl-[18px] pr-3 border-b border-black/8 dark:border-white/8">
            <h4 className="flex items-center gap-2 text-[17px] font-extrabold text-textBase">
              알림
              <span className="py-0.5 px-2 rounded-full bg-primary/14 text-primary text-xs font-extrabold">
                <span className="sr-only">전체 </span>
                {totalCount}
              </span>
            </h4>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className={clsx(
                  'inline-flex items-center gap-1.5 min-h-9 px-2.5 rounded-full text-xs font-bold text-textSub',
                  'hover:text-textBase hover:bg-black/6 dark:hover:bg-white/8',
                  'disabled:cursor-default disabled:text-textSub/40 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent'
                )}
              >
                <CheckCheck className="size-[15px]" aria-hidden="true" />
                모두 읽음
              </button>
              <button
                type="button"
                onClick={clearNotifications}
                className={clsx(
                  'inline-flex items-center gap-1.5 min-h-9 px-2.5 rounded-full text-xs font-bold text-textSub',
                  'hover:text-danger hover:bg-danger/10'
                )}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                전체 삭제
              </button>
              <Tooltip content="닫기" position="bottom">
                <button
                  type="button"
                  onClick={startClose}
                  aria-label="닫기"
                  className="flex items-center justify-center size-9 rounded-full text-textSub hover:text-textBase hover:bg-black/6 dark:hover:bg-white/8"
                >
                  <CloseIcon className="size-[18px]" aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          </div>

          <div id="notificationList" className="relative">
            <ul
              ref={containerRef}
              className="overflow-y-auto h-[377px] max-h-[60dvh] p-1.5 pb-2 scrollbar"
            >
              {currentList.length > 0 ? (
                currentList.map((n) => {
                  const menuButtonId = `notification-menu-button-${n.id}`;

                  return (
                    <li
                      key={n.id}
                      data-id={n.id}
                      ref={(el) => {
                        itemRefs.current[n.id] = el
                      }}
                      className={clsx(
                        'group relative grid grid-cols-[34px_minmax(0,1fr)_36px] items-start gap-3 min-h-11 py-3 pr-1.5 pl-4 rounded-xl text-sm break-words',
                        'hover:bg-black/4 dark:hover:bg-white/5',
                        !n.read && 'bg-primary/5'
                      )}
                    >
                      {!n.read && (
                        <span
                          aria-hidden="true"
                          className="absolute left-[5px] top-[25px] size-1.5 rounded-full bg-primary"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => toggleRead(n.id)}
                        aria-label={n.read ? '읽지 않음으로 표시' : '읽음으로 표시'}
                        className={clsx(
                          'flex items-center justify-center size-[34px] rounded-full transition-opacity',
                          'hover:ring-2 hover:ring-current/30',
                          TONE_CLASS[n.type ?? 'info'],
                          n.read && 'opacity-60'
                        )}
                      >
                        {(() => {
                          if (!n.type) return <LogoMoIcon className="size-3.5" aria-hidden="true" />;
                          const TypeIcon = TYPE_ICON[n.type];
                          return <TypeIcon className="size-4" strokeWidth={2.4} aria-hidden="true" />;
                        })()}
                      </button>
                      <div className="min-w-0 flex flex-col gap-1">
                        <p
                          className={clsx(
                            'leading-[1.45] break-keep',
                            n.read ? 'font-medium text-textSub/80' : 'font-bold text-textBase'
                          )}
                        >
                          {n.message}
                        </p>
                        <time
                          dateTime={new Date(n.timestamp).toISOString()}
                          title={new Date(n.timestamp).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          className="text-xs text-textSub/70"
                        >
                          {formatRelativeTime(n.timestamp, now)}
                        </time>
                      </div>
                      <button
                        type="button"
                        id={menuButtonId}
                        className={clsx(
                          'flex justify-center items-center size-9 rounded-[10px] text-textSub',
                          'transition-opacity duration-150',
                          'hover:text-textBase hover:bg-black/6 dark:hover:bg-white/8',
                          'focus-visible:opacity-100 group-hover:opacity-100',
                          openDropdownId === n.id
                            ? 'opacity-100 bg-black/6 dark:bg-white/8'
                            : 'opacity-0 max-lg:opacity-100'
                        )}
                        onClick={(e) => {
                          setOpenDropdownId((prev) => (prev === n.id ? null : n.id));
                          setAnchorEl(e.currentTarget);
                        }}
                        aria-haspopup="menu"
                        aria-expanded={openDropdownId === n.id}
                        aria-label="알림 메뉴 열기"
                      >
                        <Ellipsis className="size-[18px]" aria-hidden="true" />
                      </button>
                    </li>
                  )
                })
              ) : (
                <li className="flex flex-col items-center justify-center gap-3 h-full px-6 text-center">
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-center size-15 rounded-full bg-black/5 dark:bg-white/6 text-textSub/70"
                  >
                    <BellOff className="size-[26px]" />
                  </span>
                  <strong className="text-[15px] text-textBase">새 알림이 없습니다.</strong>
                  <p className="-mt-1 text-[13px] leading-normal text-textSub/70 break-keep">
                    댓글, 좋아요, 계정 관련 소식이 생기면 여기에 알려드릴게요.
                  </p>
                </li>
              )}

            </ul>

            {openDropdownId &&
              anchorEl &&
              (() => {
                const { top: elTop, height } = anchorEl.getBoundingClientRect();
                const listElement = document.getElementById('notificationList');
                if (!listElement) return null;

                const { top: liTop } = listElement.getBoundingClientRect();
                const menuTarget = notifications.find((n) => n.id === openDropdownId);

                return (
                  <div
                    className={clsx(
                      'z-200 absolute min-w-[168px] p-1.5 rounded-xl',
                      'bg-background border border-black/8 shadow-[0_12px_30px_rgba(0,0,0,0.15)]',
                      'dark:bg-[#1E1E1E] dark:border-[#2E2E2E] dark:shadow-[0_12px_30px_rgba(0,0,0,0.5)]',
                      'transition-all duration-200 transform origin-top-right',
                      openDropdownId !== null ? 'animate-fade-in' : 'animate-fade-out'
                    )}
                    style={{
                      top: elTop + height - liTop + 4,
                      right: '12px',
                    }}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby={`notification-menu-button-${openDropdownId}`}
                  >
                    {menuTarget && (
                      <button
                        type="button"
                        onClick={() => {
                          toggleRead(menuTarget.id);
                          setOpenDropdownId(null);
                        }}
                        role="menuitem"
                        className={clsx(
                          'flex items-center gap-2.5 w-full min-h-10 px-2.5 rounded-lg text-[13px] text-textBase',
                          'hover:bg-black/5 focus-visible:bg-black/5 dark:hover:bg-[#2A2A2A] dark:focus-visible:bg-[#2A2A2A]'
                        )}
                      >
                        <CircleDot className="shrink-0 size-4 text-textSub" aria-hidden="true" />
                        {menuTarget.read ? '읽지 않음으로 표시' : '읽음으로 표시'}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        removeNotification(openDropdownId);
                        setOpenDropdownId(null);
                      }}
                      role="menuitem"
                      aria-label="알림 삭제"
                      className={clsx(
                        'flex items-center gap-2.5 w-full min-h-10 px-2.5 rounded-lg text-[13px] text-danger',
                        'hover:bg-danger/12 focus-visible:bg-danger/12'
                      )}
                    >
                      <Trash2 className="shrink-0 size-4" aria-hidden="true" />
                      삭제하기
                    </button>
                  </div>
                );
              })()}
          </div>

          <div className="pt-2 px-3 pb-3 border-t border-black/8 dark:border-white/8">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => Math.min(c + perPage, notifications.length))}
              disabled={visibleCount >= totalCount}
              className={clsx(
                'flex items-center justify-center w-full min-h-11 rounded-xl text-[13px] font-bold cursor-pointer',
                'bg-black/5 text-textBase hover:bg-black/8',
                'dark:bg-[#1C1C1C] dark:hover:bg-[#262626]',
                'disabled:cursor-default disabled:text-textSub/50 disabled:hover:bg-black/5 dark:disabled:hover:bg-[#1C1C1C]'
              )}
            >
              {totalCount > 0 && visibleCount >= totalCount ? '모든 알림을 불러왔어요' : '알림 더보기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
