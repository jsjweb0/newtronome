import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useNotifications, type NotificationInput } from '../../contexts/NotificationContext';
import { NotificationProvider } from '../../contexts/NotificationProvider';
import NotificationDropdown from './NotificationDropdown';

const NOW = new Date(2026, 10, 11, 18, 0, 0).getTime();

class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function Seed({ items }: { items: NotificationInput[] }) {
  const { addNotification } = useNotifications();
  useEffect(() => {
    items.forEach(addNotification);
  }, [items, addNotification]);
  return null;
}

function renderDropdown(items: NotificationInput[]) {
  return render(
    <NotificationProvider>
      <MemoryRouter>
        <Seed items={items} />
        <NotificationDropdown />
      </MemoryRouter>
    </NotificationProvider>
  );
}

function openPanel() {
  fireEvent.click(screen.getByRole('button', { name: /^알림/ }));
}

describe('NotificationDropdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('모두 읽음을 누르면 안 읽은 알림이 0개가 되고 버튼이 비활성화된다', () => {
    renderDropdown([
      { id: 1, message: '첫 알림', timestamp: NOW - 1000 },
      { id: 2, message: '둘째 알림', timestamp: NOW - 2000 },
    ]);

    expect(screen.getByRole('button', { name: '알림, 읽지 않은 알림 2개' })).toBeTruthy();
    openPanel();

    const markAllButton = screen.getByRole('button', { name: '모두 읽음' });
    expect(markAllButton).toHaveProperty('disabled', false);

    fireEvent.click(markAllButton);

    expect(screen.getByRole('button', { name: '알림' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: '읽지 않음으로 표시' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: '모두 읽음' })).toHaveProperty('disabled', true);
  });

  it('상대 시간을 time 요소로 보여주고 전체 시각을 title로 제공한다', () => {
    const timestamp = NOW - 5 * 60 * 1000;
    renderDropdown([{ id: 1, message: '알림', timestamp }]);
    openPanel();

    const time = screen.getByText('5분 전');
    expect(time.tagName).toBe('TIME');
    expect(time.getAttribute('dateTime')).toBe(new Date(timestamp).toISOString());
    expect(time.getAttribute('title')).toBe(
      new Date(timestamp).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  });

  it('열려 있는 동안 1분마다 상대 시간을 다시 계산한다', () => {
    renderDropdown([{ id: 1, message: '알림', timestamp: NOW - 30 * 1000 }]);
    openPanel();

    expect(screen.getByText('방금 전')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(screen.getByText('1분 전')).toBeTruthy();
  });

  it('닫혀 있는 동안에는 갱신 타이머를 돌리지 않고, 다시 열 때 현재 시각으로 계산한다', () => {
    renderDropdown([{ id: 1, message: '알림', timestamp: NOW - 30 * 1000 }]);

    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(3 * 60 * 1000);
    });
    openPanel();

    expect(screen.getByText('3분 전')).toBeTruthy();
  });
});
