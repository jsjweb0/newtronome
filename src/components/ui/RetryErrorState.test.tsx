import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RetryErrorState from './RetryErrorState';

afterEach(() => {
  cleanup();
});

describe('RetryErrorState', () => {
  it('shows the message as an alert with the default description and calls onRetry', () => {
    const onRetry = vi.fn();
    render(<RetryErrorState message="플레이리스트를 불러오지 못했습니다." onRetry={onRetry} />);

    expect(screen.getByRole('alert').textContent).toBe('플레이리스트를 불러오지 못했습니다.');
    expect(screen.getByText('네트워크 상태를 확인하고 다시 시도해 주세요.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('hides the description in the compact size', () => {
    render(<RetryErrorState size="compact" message="댓글을 불러오지 못했습니다." onRetry={vi.fn()} />);

    expect(screen.queryByText('네트워크 상태를 확인하고 다시 시도해 주세요.')).toBeNull();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeTruthy();
  });

  it('uses a custom description when given', () => {
    render(<RetryErrorState description="잠시 후 다시 시도해 주세요." onRetry={vi.fn()} />);

    expect(screen.getByText('잠시 후 다시 시도해 주세요.')).toBeTruthy();
  });

  it('disables the button and changes the label while retrying', () => {
    render(<RetryErrorState isRetrying onRetry={vi.fn()} />);

    const button = screen.getByRole('button', { name: '다시 불러오는 중…' }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
