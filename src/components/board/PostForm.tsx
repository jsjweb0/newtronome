import { BaseButton } from '../ui/BaseButton';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ChevronLeft, CircleAlert, Megaphone, PencilLine } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useToast } from '../../contexts/ToastContext';
import FormInput from '../ui/FormInput';
import { useAuth } from '../../contexts/AuthContext';
import { AuthAccess } from '../auth/AuthAccess';
import FormTextarea from '../ui/FormTextarea';
import type { CommunityBoardType, Post } from '../../features/board/types/post';
import { FREE_BOARD_CATEGORIES, LEGACY_FREE_BOARD_CATEGORY_VALUES, } from '../../constants/freeBoardCategories';
import { normalizeLegacyPostContent } from '../../utils/postContent';

type PostFormMode = 'create' | 'edit';

export interface PostFormValues {
  title: string;
  content: string;
  category: string | null;
  isNotice: boolean;
}

interface PostFormProps {
  mode?: PostFormMode;
  boardType: CommunityBoardType;
  initialData?: Post | null;
  onSubmit: (values: PostFormValues) => void | Promise<void>;
}

export default function PostForm({
  mode = 'create',
  boardType,
  onSubmit,
  initialData
}: PostFormProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [inputTitle, setInputTitle] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isNotice, setNotice] = useState(false);
  const defaultWriter = user?.displayName?.trim() ? user.displayName : user?.email || '';
  const [writer, setWriter] = useState(defaultWriter);
  const [errors, setError] = useState({ category: '', title: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);
  const initializedPostRef = useRef<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      const postKey = `${boardType}/${initialData.id}`;
      if (initializedPostRef.current === postKey) return;
      initializedPostRef.current = postKey;

      setInputTitle(initialData.title || '');
      setInputContent(normalizeLegacyPostContent(initialData.content || ''));

      const initialCategory = initialData.category ?? '';
      setSelectedCategory(
        LEGACY_FREE_BOARD_CATEGORY_VALUES[initialCategory] ?? initialCategory
      );

      setNotice(initialData.isNotice || false);
      const authorName = initialData.displayName?.trim() || '알 수 없는 사용자';
      setWriter(
        authorName?.trim() ? authorName : defaultWriter
      );
    } else {
      initializedPostRef.current = null;
      setWriter(defaultWriter);
    }
  }, [initialData, mode, defaultWriter, boardType]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const newErrors = { category: '', title: '', content: '' };
    let hasError = false;

    if (boardType === 'free' && !selectedCategory) {
      newErrors.category = '카테고리를 선택해 주세요.';
      showToast({ message: '카테고리를 선택해 주세요.', type: 'error' });
      hasError = true;
    } else if (!inputTitle.trim()) {
      newErrors.title = '제목을 입력해주세요.';
      showToast({ message: '제목을 입력해주세요.', type: 'error' });
      hasError = true;
      titleRef.current?.focus();
    } else if (!inputContent.trim()) {
      newErrors.content = '내용을 입력해주세요.';
      showToast({ message: '내용을 입력해주세요.', type: 'error' });
      hasError = true;
      contentRef.current?.focus();
    }

    setError(newErrors);
    if (hasError) return;

    const payload: PostFormValues = {
      title: inputTitle.trim(),
      content: inputContent.trim(),
      category: selectedCategory || null,
      isNotice,
    };

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await onSubmit(payload);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const boardMeta = boardType === 'notice'
    ? { title: 'Notice', label: '공지사항' }
    : { title: 'Free Board', label: '자유게시판' };
  const heading = mode === 'edit' ? '글 수정' : '글쓰기';
  const description = mode === 'edit'
    ? `${boardMeta.label}에 올린 글을 고쳐요`
    : `${boardMeta.label}에 새 글을 남겨요`;

  return (
    <section aria-labelledby="post-form-title" className="w-full max-w-225 mx-auto flex flex-col gap-3.5 md:gap-4.5 px-1 md:px-7 pb-6">
      <Link
        to={`/board/${boardType}`}
        className="self-start inline-flex items-center gap-1 min-h-11 pr-2 text-sm text-textSub hover:text-textBase"
      >
        <ChevronLeft aria-hidden="true" className="size-4.5" />
        {boardMeta.title}
      </Link>
      <div className="flex items-center gap-3">
        <PencilLine aria-hidden="true" className="shrink-0 size-6.5 text-primary" />
        <div>
          <h1 id="post-form-title" className="text-[28px] leading-tight font-extrabold tracking-tight text-textBase">
            {heading}
          </h1>
          <p className="mt-0.5 text-[13px] text-textSub">{description}</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-5 md:gap-6 px-4 py-5 md:px-8 md:py-7 rounded-2xl border border-line bg-surface"
      >
        <AuthAccess allow={['admin']}>
          <label
            htmlFor="isNotice"
            className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-textThr bg-field cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-primary"
          >
            <span className="flex items-center gap-2.5">
              <Megaphone aria-hidden="true" className="shrink-0 size-5 text-primary" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-bold text-textBase">공지글로 등록</span>
                <span className="text-xs text-textSub">관리자에게만 보이는 옵션 · 목록 맨 위에 고정돼요</span>
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              id="isNotice"
              className="peer sr-only"
              checked={isNotice}
              onChange={(e) => setNotice(e.target.checked)}
            />
            <span
              aria-hidden="true"
              className="relative shrink-0 w-11.5 h-6.5 rounded-full bg-textThr transition-colors peer-checked:bg-primary after:absolute after:top-0.75 after:left-0.75 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
            />
          </label>
        </AuthAccess>

        {boardType === 'free' && (
          <div className="flex flex-col gap-2.5">
            <span id="category-label" className="text-sm font-bold text-textBase">
              카테고리 <span aria-hidden="true" className="text-primary">*</span>
            </span>
            <div
              role="radiogroup"
              aria-labelledby="category-label"
              aria-describedby={errors.category ? 'category-error' : undefined}
              aria-invalid={Boolean(errors.category)}
              className="flex flex-wrap gap-2"
            >
              {FREE_BOARD_CATEGORIES.map((category) => {
                const isChecked = selectedCategory === category.value;

                return (
                  <button
                    key={category.value}
                    type="button"
                    role="radio"
                    aria-checked={isChecked}
                    onClick={() => {
                      setSelectedCategory(category.value);
                      setError((prev) => ({ ...prev, category: '' }));
                    }}
                    className={clsx(
                      'min-h-11 px-4.5 rounded-full border text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      isChecked
                        ? 'border-primary bg-primary text-onPrimary'
                        : 'border-textThr text-textSub hover:bg-field hover:text-textBase'
                    )}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>

            {errors.category && (
              <p id="category-error" className="flex items-center gap-1 text-xs text-danger">
                <CircleAlert aria-hidden="true" className="size-3.5" />
                {errors.category}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-bold text-textBase">작성자</span>
          <div className="flex items-center gap-2.5 min-h-12 px-3.5 rounded-xl border border-textThr bg-field">
            <Avatar
              name={writer || '?'}
              photoURL={mode === 'edit' ? initialData?.photoURL : user?.photoURL}
              className="size-7 text-xs"
            />
            <span className="min-w-0 truncate text-[15px] text-textBase">{writer}</span>
            {mode === 'create' && (
              <span className="ml-auto max-md:hidden text-xs text-textSub">로그인한 계정으로 등록돼요</span>
            )}
          </div>
        </div>

        <FormInput
          type="text"
          name="postTitle"
          id="post-title-input"
          label="제목"
          required
          className="text-base"
          value={inputTitle}
          onChange={(e) => {
            setInputTitle(e.target.value);
            setError((prev) => ({ ...prev, title: '' }));
          }}
          placeholder="제목을 입력해주세요"
          error={errors.title}
          ref={titleRef}
        />

        <FormTextarea
          name="content"
          id="post-content-input"
          label="내용"
          required
          placeholder="내용을 입력해주세요."
          value={inputContent}
          onChange={(e) => {
            setInputContent(e.target.value);
            setError((prev) => ({ ...prev, content: '' }));
          }}
          error={errors.content}
          ref={contentRef}
        />

        <div className="flex max-md:flex-col-reverse justify-center gap-2.5 pt-1">
          <BaseButton type="button" variant="cancel" className="min-h-12 px-6 text-[15px]" onClick={() => navigate(-1)}>
            취소
          </BaseButton>
          <BaseButton type="submit" className="min-h-12 px-7 text-[15px]" disabled={isSubmitting}>
            {isSubmitting ? '처리 중...' : mode === 'edit' ? '수정' : '등록'}
          </BaseButton>
        </div>
      </form>
    </section>
  );
}
