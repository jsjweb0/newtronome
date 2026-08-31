import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, X as CloseIcon, Ellipsis, Trash2 } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import Tooltip from './Tooltip';
import clsx from 'clsx';
import { LogoMoIcon } from '../icons';

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
            className="relative inline-flex justify-center items-center size-11 max-lg:pt-px rounded-full lg:hover:text-primary lg:hover:bg-primary/6"
            onClick={() => {
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
                  'absolute top-3 lg:top-1.5 inset-e-2.5 lg:inset-e-1 inline-flex items-center justify-center py-0.5 px-1 lg:py-1 lg:px-1.5 rounded-full text-[10px] lg:text-xs font-medium text-white bg-red-500 leading-none',
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
            'z-300 fixed sm:absolute right-3 lg:right-0 mt-0.5 lg:mt-2 w-[calc(100%-1.5em)] sm:w-sm bg-background rounded-xl shadow-xl',
            open && !isClosing && 'animate-fade-in',
            isClosing && 'animate-fade-out'
          )}
        >
          <div className="flex justify-between items-center py-4 pl-6 pr-4 border-b border-b-textThr">
            <h4 className="font-bold text-gray-900 dark:text-white">알림 {totalCount}</h4>
            <div className="flex gap-3">
              <button onClick={clearNotifications} className="text-sm text-textSub hover:underline">
                전체 삭제
              </button>
              <Tooltip content="닫기" position="bottom">
                <button
                  onClick={startClose}
                  aria-label="닫기"
                  className="flex items-center justify-center size-8 rounded-full hover:bg-primary/10"
                >
                  <CloseIcon className="size-5" aria-hidden="true" />
                </button>
              </Tooltip>
            </div>
          </div>

          <div id="notificationList" className="relative">
            <ul ref={containerRef} className="overflow-y-auto h-[377px] scrollbar">
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
                        'group flex justify-between items-start relative p-4 border-b border-b-textThr text-sm break-words',
                        'last:border-b-0',
                        'hover:bg-textThr/30'
                      )}
                    >
                      <div className="relative pl-6">
                        <button
                          onClick={() => toggleRead(n.id)}
                          aria-label={n.read ? '읽지 않음으로 표시' : '읽음으로 표시'}
                          className="absolute top-1.5 left-0"
                        >
                          <span
                            aria-hidden="true"
                            className={clsx(
                              'block size-2 rounded-full',
                              !n.read && 'bg-primary'
                            )}
                          />
                        </button>
                        <div>
                          <div className="flex gap-2 items-center font-semibold">
                            <span className="">
                              <LogoMoIcon className="size-3.5 text-primary" aria-hidden="true" />
                            </span>
                            <p>{n.message}</p>
                          </div>
                          <p className="mt-1 text-textSub/70 text-[13px]">
                            {new Date(n.timestamp).toLocaleString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 relative inline-flex">
                        <button
                          type="button"
                          id={menuButtonId}
                          className={clsx(
                            'flex justify-center items-center size-9 text-sm rounded-lg text-gray-800',
                            'transition-all duration-200',
                            'focus:outline-hidden focus:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none',
                            'dark:border-neutral-700 dark:text-textBase dark:focus:bg-neutral-800',
                            'group-hover:opacity-100! group-hover:visible!',
                            'group-focus-within:opacity-100! group-focus-within:visible!',
                            openDropdownId === n.id ? 'opacity-100 visible' : 'opacity-0 invisible'
                          )}
                          onClick={(e) => {
                            setOpenDropdownId((prev) => (prev === n.id ? null : n.id));
                            setAnchorEl(e.currentTarget);
                          }}
                          aria-haspopup="menu"
                          aria-expanded={openDropdownId === n.id}
                          aria-label="알림 메뉴 열기"
                        >
                          <Ellipsis className="size-5" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  )
                })
              ) : (
                <li className="flex justify-between items-start relative px-8 py-4 text-sm break-words">
                  새 알림이 없습니다.
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

                return (
                  <div
                    className={clsx(
                      'z-200 absolute w-30 bg-white shadow-md rounded-lg',
                      'transition-all duration-200 transform origin-top-right',
                      'dark:bg-neutral-800 dark:border dark:border-neutral-700',
                      openDropdownId !== null ? 'animate-fade-in' : 'animate-fade-out'
                    )}
                    style={{
                      top: elTop + height - liTop,
                      right: '30px',
                    }}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby={`notification-menu-button-${openDropdownId}`}
                  >
                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => {
                          removeNotification(openDropdownId);
                          setOpenDropdownId(null);
                        }}
                        role="menuitem"
                        aria-label="알림 삭제"
                        className={clsx(
                          'flex items-center gap-x-2.5 w-full py-2 px-3 rounded-lg text-sm text-textSub',
                          'hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100',
                          'dark:hover:bg-neutral-700 dark:focus:bg-neutral-700'
                        )}
                      >
                        <Trash2 className="shrink-0 size-4" aria-hidden="true" />
                        삭제하기
                      </button>
                    </div>
                  </div>
                );
              })()}
          </div>

          <div className="border-t border-t-textThr">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => Math.min(c + perPage, notifications.length))}
              disabled={visibleCount >= totalCount}
              className="flex items-center justify-center w-full p-4 text-primary text-sm font-semibold cursor-pointer disabled:text-textThr"
            >
              알림 더보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
