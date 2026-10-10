import { Navigate, useNavigate, useParams, useSearchParams, } from 'react-router-dom';
import {
  isCommunityBoardType,
  type CommunityBoardType,
  type Post,
  type UpdatePostInput,
} from '../../contexts/PostsContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import PostForm, {
  type PostFormValues,
} from '../../components/board/PostForm';
import { getUserRole } from '../../utils/role';
import { createBoardListSearch } from '../../features/board/utils/boardListSearch';
import { useUpdatePost } from '../../features/board/hooks/useUpdatePost';
import { useBoardPost } from '../../features/board/hooks/useBoardPost';
import { RotateCcw } from 'lucide-react';

export default function EditPostPage() {
  const { boardType, id } = useParams();

  if (!isCommunityBoardType(boardType) || !id) {
    return <Navigate to="/board/free" replace />;
  }

  return <EditPostContent boardType={boardType} postId={id} />;
}

function EditPostContent({ boardType, postId }: {
  boardType: CommunityBoardType;
  postId: Post['id'];
}) {
  const { mutateAsync: updatePost } = useUpdatePost();
  const { data: post, isPending, isError, error, refetch } = useBoardPost(boardType, postId);
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


  const handleEdit = async (
    updatedPost: PostFormValues
  ): Promise<void> => {
    if (
      !user ||
      !postId
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
      await updatePost({
        boardType,
        postId,
        input: changedFields
      });

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

  if (isPending) return <p>게시글을 불러오는 중입니다.</p>;

  if (isError) {
    if (error.message === '해당 문서가 없습니다.') {
      return <p>게시글이 존재하지 않습니다.</p>;
    }
    return (
      <div className="mt-10 text-center" role="alert">
        <p>게시글을 불러오지 못했습니다.</p>
        <button type="button" className="mt-4 text-primary" onClick={() => { void refetch(); }}>
          <RotateCcw aria-hidden="true" />  다시 시도
        </button>
      </div>
    );
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
