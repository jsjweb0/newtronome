import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PostForm from './PostForm';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'user@example.com', displayName: '사용자' },
  }),
}));
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('../auth/AuthAccess', () => ({
  AuthAccess: () => null,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PostForm submission state', () => {
  it('blocks another submission until the current submission settles', () => {
    const onSubmit = vi.fn(() => new Promise<void>(() => undefined));

    render(
      <MemoryRouter>
        <PostForm boardType="free" onSubmit={onSubmit} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByTitle('카테고리'), { target: { value: 'chat' } });
    fireEvent.change(screen.getByPlaceholderText('제목을 입력해주세요'), {
      target: { value: '제목' },
    });
    fireEvent.change(screen.getByPlaceholderText('내용을 입력해주세요.'), {
      target: { value: '내용' },
    });

    const submitButton = screen.getByRole('button', { name: '등록' });
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(
      (screen.getByRole('button', { name: '처리 중...' }) as HTMLButtonElement).disabled
    ).toBe(true);
  });
});
