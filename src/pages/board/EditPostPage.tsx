import { Navigate, useNavigate, useParams, useSearchParams, } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  isCommunityBoardType,
  type Post,
  type UpdatePostInput,
  usePosts
} from '../../contexts/PostsContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import PostForm, {
  type PostFormValues,
} from '../../components/board/PostForm';
import { getUserRole } from '../../utils/role';
import { createBoardListSearch } from '../../features/board/utils/boardListSearch';

export default function EditPostPage() {
  const { boardType, id } = useParams();
  const { getPosts, updatePost } = usePosts();
  const [post, setPost] = useState<Post | null | undefined>(null);
  const [loadError, setLoadError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const role = getUserRole(user);

  const [searchParams] = useSearchParams();
  const pageFromQuery = Number.parseInt(searchParams.get('page') ?? '', 10);
  const page = Number.isSafeInteger(pageFromQuery) && pageFromQuery > 0 ? pageFromQuery : 1;
  const keyword = searchParams.get('keyword') ?? '';
  const category = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';

  const boardSearch = createBoardListSearch({
    page,
    keyword,
    category,
    sort,
  });


  useEffect(() => {
    if (!id || !isCommunityBoardType(boardType)) {
      return;
    }

    let ignore = false;

    const fetchPost = async () => {
      setPost(null);
      setLoadError('');

      try {
        const posts = await getPosts(boardType);
        if (ignore) return;

        const found = posts.find((item) => String(item.id) === id);
        setPost(found);
      } catch (error) {
        if (!ignore) {
          console.error('게시글 조회 실패:', error);
          setLoadError('게시글을 불러오지 못했습니다.');
        }
      }
    };

    void fetchPost();

    return () => {
      ignore = true;
    };
  }, [boardType, id, getPosts, retryCount]);

  const handleEdit = async (
    updatedPost: PostFormValues
  ): Promise<void> => {
    if (
      !user ||
      !id ||
      !isCommunityBoardType(boardType)
    ) {
      return;
    }

    const changedFields: UpdatePostInput = {
      title: updatedPost.title,
      content: updatedPost.content,
      category: updatedPost.category,
      updatedAt: new Date().toISOString(),
    };

    if (role === 'admin') {
      changedFields.isNotice = updatedPost.isNotice;
    }

    try {
      await updatePost(boardType, id, changedFields);

      showToast({ message: '게시글이 수정되었습니다.' });
      addNotification({
        notificationId: Date.now(),
        message: '게시글이 수정되었습니다',
      });

      navigate(`/board/${boardType}${boardSearch}`);
    } catch (error) {
      console.error('게시글 수정 실패:', error);

      const notification = {
        notificationId: Date.now(),
        message: '게시글 수정에 실패했습니다.',
      };

      showToast({
        message: notification.message,
        type: 'error',
      });

      addNotification(notification);
    }
  };

  if (!isCommunityBoardType(boardType) || !id) {
    return <Navigate to="/board/free" replace />;
  }

  if (post === null) {
    if (loadError) {
      return (
        <div className="mt-10 text-center" role="alert">
          <p>{loadError}</p>
          <button type="button" className="mt-4 text-primary" onClick={() => setRetryCount((count) => count + 1)}>
            다시 시도
          </button>
        </div>
      );
    }
    return <p>게시글을 불러오는 중입니다.</p>;
  }

  if (post === undefined) {
    return <p>게시글이 존재하지 않습니다.</p>;
  }

  const canEdit =
    user &&
    (user.uid === post.authorUid || role === 'admin');

  if (!canEdit) {
    return <Navigate to={`/board/${boardType}`} replace />;
  }

  return (
    <PostForm mode="edit" boardType={boardType} initialData={post} onSubmit={handleEdit} />
  );
}
