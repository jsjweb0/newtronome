import type { ReactElement, ReactNode } from 'react';
import { cloneElement, useEffect, useId, useRef, useState } from 'react';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  enabled?: boolean;
  children: ReactElement<{ 'aria-describedby'?: string }>;
  content: ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
}

export default function Tooltip({
  enabled = true,
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLSpanElement | null>(null);
  const touchInteractionRef = useRef(false);
  const tooltipId = useId();

  const clearShowTimer = () => {
    if (showTimerRef.current === null) return;
    window.clearTimeout(showTimerRef.current);
    showTimerRef.current = null;
  };

  const clearHideTimer = () => {
    if (hideTimerRef.current === null) return;
    window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  };

  const show = (autoHide = false) => {
    clearShowTimer();
    clearHideTimer();

    showTimerRef.current = window.setTimeout(() => {
      setVisible(true);
      showTimerRef.current = null;

      if (autoHide) {
        hideTimerRef.current = window.setTimeout(() => {
          setVisible(false);
          hideTimerRef.current = null;
        }, 1500);
      }
    }, delay);
  };

  const hide = () => {
    clearShowTimer();
    clearHideTimer();
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (showTimerRef.current !== null) {
        window.clearTimeout(showTimerRef.current);
      }
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  // 위치 계산
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const tooltip = tooltipRef.current;

    if (!visible || !wrapper || !tooltip) return;

    const frameId = window.requestAnimationFrame(() => {
      const rect = wrapper.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      let x = 0,
        y = 0;
      switch (position) {
        case 'top':
          x = rect.width / 2 - tooltipRect.width / 2;
          y = -tooltipRect.height - 8;
          break;
        case 'bottom':
          x = rect.width / 2 - tooltipRect.width / 2;
          y = rect.height + 8;
          break;
        case 'left':
          x = -tooltipRect.width - 8;
          y = rect.height / 2 - tooltipRect.height / 2;
          break;
        case 'right':
          x = rect.width + 8;
          y = rect.height / 2 - tooltipRect.height / 2;
          break;
      }

      setOffset({ x, y });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [visible, position]);

  if (!enabled) return <>{children}</>;

  const describedBy = [children.props['aria-describedby'], tooltipId].filter(Boolean).join(' ');
  const trigger = cloneElement(children, { 'aria-describedby': describedBy });

  return (
    <div
      ref={wrapperRef}
      className={`relative inline-flex ${className}`}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') show();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'touch') hide();
      }}
      onPointerDown={(event) => {
        if (event.pointerType !== 'touch') return;
        touchInteractionRef.current = true;
        show(true);
      }}
      onPointerUp={() => {
        touchInteractionRef.current = false;
      }}
      onPointerCancel={() => {
        touchInteractionRef.current = false;
        hide();
      }}
      onFocus={() => {
        if (!touchInteractionRef.current) show();
      }}
      onBlur={hide}
    >
      {trigger}
      {visible && (
        <span
          id={tooltipId}
          ref={tooltipRef}
          className="tooltip-content visible inline-flex absolute z-999 px-2 py-1 bg-gray-900 text-white font-medium text-xs rounded-md shadow-2xs transition-opacity whitespace-nowrap animate-fade-in"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            opacity: visible ? 1 : 0,
          }}
          role="tooltip"
        >
          {content}
        </span>
      )}
    </div>
  );
}
