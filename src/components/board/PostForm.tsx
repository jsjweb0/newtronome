import { BaseButton } from '../ui/BaseButton';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import FormInput from '../ui/FormInput';
import { useAuth } from '../../contexts/AuthContext';
import { AuthAccess } from '../auth/AuthAccess';
import FormTextarea from '../ui/FormTextarea';
import type {
  CommunityBoardType,
  Post,
} from '../../contexts/PostsContext';

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

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const categoryList = ['카테고리1', '카테고리2', '카테고리3', '카테고리4'];

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setInputTitle(initialData.title || '');
      setInputContent(initialData.content || '');
      setSelectedCategory(initialData.category || '');
      setNotice(initialData.isNotice || false);
      const authorName = initialData.displayName || initialData.email;
      setWriter(
        authorName?.trim() ? authorName : defaultWriter
      );
    } else {
      setWriter(defaultWriter);
    }
  }, [initialData, mode, defaultWriter]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newErrors = { category: '', title: '', content: '' };
    let hasError = false;

    if (boardType === 'free' && !selectedCategory) {
      newErrors.category = '카테고리를 선택해 주세요.';
      showToast({ message: '카테고리를 선택해 주세요.', type: 'error' });
      hasError = true;
    }
    if (!inputTitle.trim()) {
      newErrors.title = '제목을 입력해주세요.';
      showToast({ message: '제목을 입력해주세요.', type: 'error' });
      hasError = true;
      titleRef.current?.focus();
    }
    if (!inputContent.trim()) {
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

    await onSubmit(payload);
  };

  const baseClasses =
    'mt-3 py-2.5 sm:py-3 px-4 block w-full border border-gray-200 rounded-lg text-xs md:text-base focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600';

  return (
    <div className="max-w-[85rem] mx-auto mb-8 px-4">
      <form onSubmit={handleSubmit}>
        <h2 className="mb-4 md:mb-8 text-lg md:text-2xl text-center font-bold text-gray-800 dark:text-white">
          {mode === 'edit' ? '글 수정' : '글쓰기'}
        </h2>

        <AuthAccess allow={['admin']}>
          <div className="mb-3">
            <label
              htmlFor="isNotice"
              className="flex items-center p-3 w-full text-xs md:text-base border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400"
            >
              <input
                type="checkbox"
                id="isNotice"
                className="shrink-0 mt-0.5 border-gray-200 rounded-sm text-blue-600 focus:ring-blue-500 checked:border-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800"
                checked={isNotice}
                onChange={(e) => setNotice(e.target.checked)}
              />
              <span className="text-gray-600 ms-3 dark:text-neutral-400">공지글</span>
            </label>
          </div>
        </AuthAccess>

        <FormInput
          type="text"
          name="date"
          className="mb-3 text-xs md:text-base"
          value={formattedDate}
          readOnly
          title="작성일"
        />

        {boardType === 'free' && (
          <>
            <select
              id="category"
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value);
                setError((prev) => ({ ...prev, category: '' }));
              }}
              className={`${baseClasses} pe-9`}
              title="카테고리"
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? 'category-error' : undefined}
            >
              <option value="">카테고리를 선택하세요</option>

              {categoryList.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {errors.category && (
              <p
                id="category-error"
                className="my-2 text-xs text-red-600 md:text-sm"
              >
                {errors.category}
              </p>
            )}
          </>
        )}

        <FormInput
          type="text"
          name="writer"
          className="mt-3"
          onChange={(e) => setWriter(e.target.value)}
          value={writer}
          title="작성자"
          placeholder="작성자를 입력해주세요"
          readOnly
        />

        <FormInput
          type="text"
          name="postTitle"
          className="mt-3"
          value={inputTitle}
          onChange={(e) => {
            setInputTitle(e.target.value);
            setError((prev) => ({ ...prev, title: '' }));
          }}
          title="제목"
          placeholder="제목을 입력해주세요"
          error={errors.title}
          ref={titleRef}
        />

        <FormTextarea
          name="content"
          placeholder="내용을 입력해주세요."
          className="mt-3"
          title="내용"
          value={inputContent}
          onChange={(e) => {
            setInputContent(e.target.value);
            setError((prev) => ({ ...prev, content: '' }));
          }}
          error={errors.content}
          ref={contentRef}
        />

        <div className="flex justify-center items-center mt-5">
          <BaseButton type="button" className="mr-2" variant="cancel" onClick={() => navigate(-1)}>
            취소
          </BaseButton>
          <BaseButton type="submit">
            {mode === 'edit' ? '수정' : '등록'}
          </BaseButton>
        </div>
      </form>
    </div>
  );
}
