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
  it('알림 종류별 아이콘을 보여주고, 종류가 없으면 기존 로고 아이콘을 쓴다', () => {
    renderDropdown([
      { id: 5, message: '로고', timestamp: NOW },
      { id: 4, type: 'info', message: '안내', timestamp: NOW },
      { id: 3, type: 'error', message: '오류', timestamp: NOW },
      { id: 2, type: 'warning', message: '주의', timestamp: NOW },
      { id: 1, type: 'success', message: '완료', timestamp: NOW },
    ]);
    openPanel();

    const iconOf = (message: string) => {
      const item = screen.getByText(message).closest('li');
      return item?.querySelector('button[aria-label="읽음으로 표시"] svg');
    };

    expect(iconOf('완료')?.classList.contains('lucide-check')).toBe(true);
    expect(iconOf('주의')?.classList.contains('lucide-triangle-alert')).toBe(true);
    expect(iconOf('오류')?.classList.contains('lucide-x')).toBe(true);
    expect(iconOf('안내')?.classList.contains('lucide-info')).toBe(true);
    expect(iconOf('로고')).toBeTruthy();
    expect(iconOf('로고')?.classList.contains('lucide')).toBe(false);
  });

  it('메뉴의 읽음 전환 항목은 상태에 맞는 문구를 보여주고 누르면 전환 후 메뉴를 닫는다', () => {
    renderDropdown([{ id: 1, message: '알림', timestamp: NOW }]);
    openPanel();

    fireEvent.click(screen.getByRole('button', { name: '알림 메뉴 열기' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '읽음으로 표시' }));

    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: '읽지 않음으로 표시' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '알림 메뉴 열기' }));
    fireEvent.click(screen.getByRole('menuitem', { name: '읽지 않음으로 표시' }));

    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: '읽음으로 표시' })).toBeTruthy();
  });

  it('모든 알림을 불러오면 더보기 버튼이 비활성화되고 문구가 바뀐다', () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      message: `알림 ${i + 1}`,
      timestamp: NOW,
    }));
    renderDropdown(items);
    openPanel();

    const moreButton = screen.getByRole('button', { name: '알림 더보기' });
    expect(moreButton).toHaveProperty('disabled', false);

    fireEvent.click(moreButton);

    const loadedButton = screen.getByRole('button', { name: '모든 알림을 불러왔어요' });
    expect(loadedButton).toHaveProperty('disabled', true);
  });

  it('알림이 없으면 빈 상태 설명을 보여주고 더보기 문구는 그대로 비활성화된다', () => {
    renderDropdown([]);
    openPanel();

    expect(screen.getByText('새 알림이 없습니다.')).toBeTruthy();
    expect(screen.getByText('댓글, 좋아요, 계정 관련 소식이 생기면 여기에 알려드릴게요.')).toBeTruthy();
    expect(screen.getByRole('button', { name: '알림 더보기' })).toHaveProperty('disabled', true);
  });

  it('열려 있는 동안 종 버튼에 열림 상태 색을 적용한다', () => {
    renderDropdown([{ id: 1, message: '알림', timestamp: NOW }]);
    const bell = screen.getByRole('button', { name: /^알림/ });

    expect(bell.classList.contains('bg-primary/12')).toBe(false);
    expect(bell.classList.contains('text-primary')).toBe(false);

    openPanel();

    expect(bell.getAttribute('aria-expanded')).toBe('true');
    expect(bell.classList.contains('bg-primary/12')).toBe(true);
    expect(bell.classList.contains('text-primary')).toBe(true);
  });
});
