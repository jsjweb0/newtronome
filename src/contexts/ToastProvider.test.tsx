import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useToast } from './ToastContext';
import type { ToastOptions } from './ToastContext';
import { ToastProvider } from './ToastProvider';

let showToast: (options: ToastOptions) => void = () => {};

function ToastProbe() {
  showToast = useToast().showToast;
  return null;
}

function renderToast() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ToastProvider>
        <ToastProbe />
        <Routes>
          <Route path="/" element={<p>홈 화면</p>} />
          <Route path="/login" element={<p>로그인 화면</p>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>
  );
}

function show(options: ToastOptions) {
  act(() => {
    showToast(options);
  });
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function getToastCard(message: string) {
  const card = screen.getByText(message).closest('[role]');
  if (!card) throw new Error(`${message} 토스트를 찾을 수 없습니다.`);
  return card;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Toast', () => {
  it('성공·안내는 status, 주의·오류는 alert 역할로 알린다', () => {
    renderToast();

    show({ message: '저장했습니다.', type: 'success' });
    show({ message: '링크가 복사되었습니다!', type: 'info' });
    show({ message: '내용을 입력해주세요!', type: 'warning' });

    expect(getToastCard('저장했습니다.').getAttribute('role')).toBe('status');
    expect(getToastCard('저장했습니다.').getAttribute('aria-live')).toBe('polite');
    expect(getToastCard('링크가 복사되었습니다!').getAttribute('role')).toBe('status');
    expect(getToastCard('내용을 입력해주세요!').getAttribute('role')).toBe('alert');

    show({ message: '처리에 실패했습니다.', type: 'error' });

    expect(getToastCard('처리에 실패했습니다.').getAttribute('role')).toBe('alert');
    expect(screen.getByRole('region', { name: '알림 메시지' })).toBeTruthy();
  });

  it.each([
    ['success', 3000],
    ['info', 3000],
    ['warning', 4000],
    ['error', 5000],
  ] as const)('%s 토스트는 기본 %dms 동안 보인다', (type, duration) => {
    renderToast();

    show({ message: '알림', type });
    advance(duration - 1);
    expect(screen.queryByText('알림')).not.toBeNull();

    advance(1);
    expect(screen.queryByText('알림')).toBeNull();
  });

  it('type을 생략하면 성공 토스트로, duration을 넘기면 그 시간만큼 보인다', () => {
    renderToast();

    show({ message: '알림', duration: 1000 });
    expect(getToastCard('알림').getAttribute('role')).toBe('status');

    advance(1000);
    expect(screen.queryByText('알림')).toBeNull();
  });

  it('같은 메시지는 새로 띄우지 않고 기존 토스트의 타이머를 처음부터 다시 시작한다', () => {
    renderToast();

    show({ message: '알림', type: 'success' });
    advance(2000);
    show({ message: '알림', type: 'success' });

    expect(screen.getAllByText('알림')).toHaveLength(1);

    advance(2000);
    expect(screen.queryByText('알림')).not.toBeNull();

    advance(1000);
    expect(screen.queryByText('알림')).toBeNull();
  });

  it('최대 3개까지만 보이고 넘치면 가장 오래된 토스트부터 뺀다', () => {
    renderToast();

    show({ message: '첫 번째' });
    show({ message: '두 번째' });
    show({ message: '세 번째' });
    show({ message: '네 번째' });

    expect(screen.queryByText('첫 번째')).toBeNull();
    expect(screen.getAllByRole('status').map((card) => card.textContent)).toEqual([
      '두 번째',
      '세 번째',
      '네 번째',
    ]);
  });

  it('같은 순간에 여러 번 호출해도 각각 따로 닫힌다', () => {
    renderToast();

    act(() => {
      showToast({ message: '첫 번째' });
      showToast({ message: '두 번째' });
    });

    fireEvent.click(
      getToastCard('첫 번째').querySelector('button[aria-label="알림 닫기"]') as HTMLButtonElement
    );

    expect(screen.queryByText('첫 번째')).toBeNull();
    expect(screen.queryByText('두 번째')).not.toBeNull();
  });

  it('닫기 버튼을 누르면 바로 닫힌다', () => {
    renderToast();

    show({ message: '알림' });
    fireEvent.click(screen.getByRole('button', { name: '알림 닫기' }));

    expect(screen.queryByText('알림')).toBeNull();
    expect(screen.queryByRole('region', { name: '알림 메시지' })).toBeNull();
  });

  it('마우스를 올리면 타이머를 멈추고, 떠나면 남은 시간부터 이어 간다', () => {
    renderToast();

    show({ message: '알림', type: 'success' });
    advance(1000);
    fireEvent.mouseEnter(getToastCard('알림'));
    advance(10000);
    expect(screen.queryByText('알림')).not.toBeNull();

    fireEvent.mouseLeave(getToastCard('알림'));
    advance(1999);
    expect(screen.queryByText('알림')).not.toBeNull();

    advance(1);
    expect(screen.queryByText('알림')).toBeNull();
  });

  it('키보드 포커스가 토스트 안에 있으면 타이머를 멈춘다', () => {
    renderToast();

    show({ message: '알림', type: 'success' });
    const closeButton = screen.getByRole('button', { name: '알림 닫기' });

    act(() => {
      closeButton.focus();
    });
    advance(10000);
    expect(screen.queryByText('알림')).not.toBeNull();

    act(() => {
      closeButton.blur();
    });
    advance(3000);
    expect(screen.queryByText('알림')).toBeNull();
  });

  it('action이 있으면 로그인 버튼을 보여 주고, 누르면 이동하면서 토스트를 닫는다', () => {
    renderToast();

    show({
      message: '로그인 후 이용해 주세요!',
      type: 'info',
      action: { label: '로그인', to: '/login' },
    });

    const loginLink = screen.getByRole('link', { name: '로그인' });
    expect(loginLink.getAttribute('href')).toBe('/login');

    fireEvent.click(loginLink);

    expect(screen.queryByText('로그인 후 이용해 주세요!')).toBeNull();
    expect(screen.queryByText('로그인 화면')).not.toBeNull();
  });

  it('action이 없으면 닫기 버튼만 보인다', () => {
    renderToast();

    show({ message: '알림' });

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });
});
