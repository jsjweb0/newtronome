import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PostForm from './PostForm';
import type { Post } from '../../features/board/types/post';

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

    fireEvent.click(screen.getByRole('radio', { name: '수다' }));
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


describe('PostForm 입력 제한', () => {
  it.each([
    { field: 'title', value: '가'.repeat(101), message: '제목은 100자 이내로 입력해주세요.' },
    { field: 'content', value: '가'.repeat(10001), message: '본문은 10,000자 이내로 입력해주세요.' },
  ])('$field 초과 입력은 보존하고 저장하지 않는다', ({ field, value, message }) => {
    const onSubmit = vi.fn();
    render(<MemoryRouter><PostForm boardType="free" onSubmit={onSubmit} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('radio', { name: '수다' }));
    const title = screen.getByPlaceholderText<HTMLInputElement>('제목을 입력해주세요');
    const content = screen.getByPlaceholderText<HTMLTextAreaElement>('내용을 입력해주세요.');
    fireEvent.change(title, { target: { value: field === 'title' ? value : '제목' } });
    fireEvent.change(content, { target: { value: field === 'content' ? value : '본문' } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(screen.getByText(message)).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(field === 'title' ? title.value : content.value).toBe(value);
    expect(document.activeElement).toBe(field === 'title' ? title : content);
  });

  it('한글·이모지를 포함한 최대 길이의 입력을 저장할 수 있다', () => {
    const onSubmit = vi.fn();
    render(<MemoryRouter><PostForm boardType="free" onSubmit={onSubmit} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('radio', { name: '수다' }));
    fireEvent.change(screen.getByPlaceholderText('제목을 입력해주세요'), { target: { value: '😀'.repeat(100) } });
    fireEvent.change(screen.getByPlaceholderText('내용을 입력해주세요.'), { target: { value: '가'.repeat(10000) } });
    fireEvent.click(screen.getByRole('button', { name: '등록' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: '😀'.repeat(100), content: '가'.repeat(10000) }));
  });
});


it('기존 긴 본문을 바꾸지 않고 제목만 수정할 수 있다', () => {
  const onSubmit = vi.fn();
  const initialData: Post = { id: 'legacy', boardType: 'free', title: '기존 제목', content: '가'.repeat(10001), category: '카테고리1',
    authorUid: 'user-1', displayName: '작성자', photoURL: null, date: new Date(), updatedAt: null, likeCount: 0, likedUsers: [], viewCount: 0, isNotice: false };
  render(<MemoryRouter><PostForm boardType="free" mode="edit" initialData={initialData} onSubmit={onSubmit} /></MemoryRouter>);
  fireEvent.change(screen.getByPlaceholderText('제목을 입력해주세요'), { target: { value: '고친 제목' } });
  fireEvent.click(screen.getByRole('button', { name: '수정' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: '고친 제목', content: initialData.content, category: 'chat' }));
});
