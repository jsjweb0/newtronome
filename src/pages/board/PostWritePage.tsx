import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import PostForm, {
  type PostFormValues,
} from '../../components/board/PostForm';

import {
  isCommunityBoardType,
  type CommunityBoardType,
  type CreatePostInput,
} from '../../features/board/types/post';
import { useCreatePost } from '../../features/board/hooks/useCreatePost';
import { useBoardPosts } from '../../features/board/hooks/useBoardPosts';
import RetryErrorState from '../../components/ui/RetryErrorState';

export default function PostWritePage() {
  const { boardType } = useParams();

  if (!isCommunityBoardType(boardType)) {
    return <Navigate to="/board/free" replace />;
  }

  return <PostWriteContent boardType={boardType} />;
}

function PostWriteContent({
  boardType,
}: {
  boardType: CommunityBoardType;
}) {
  const {
    data: posts = [],
    isPending,
    isError,
    isFetching,
    refetch,
  } = useBoardPosts(boardType);

  const { mutateAsync: createPost } = useCreatePost();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const postNumbers = posts
    .map((post) => Number(post.postNo))
    .filter((postNo) => Number.isFinite(postNo));

  const maxPostNo = postNumbers.length
    ? Math.max(...postNumbers)
    : 0;

  const nextPostNo = maxPostNo + 1;

  const handleSubmit = async (
    formData: PostFormValues
  ): Promise<void> => {
    if (!user || !isCommunityBoardType(boardType)) return;

    const newPost: CreatePostInput = {
      ...formData,
      postNo: nextPostNo,
      content: formData.content,
      date: new Date(),
      email: user.email,
      authorUid: user.uid,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
    };

    try {
      await createPost({
        boardType,
        input: newPost,
      });

      showToast({ message: '게시글이 등록되었습니다!' });
      addNotification({
        notificationId: Date.now(),
        message: '게시글이 등록되었습니다!',
      });

      navigate(`/board/${boardType}`);
    } catch {
      const notification = {
        notificationId: Date.now(),
        message: '글 등록에 실패했습니다.',
      };

      showToast({
        message: notification.message,
        type: 'error',
      });
      addNotification(notification);
    }
  };

  if (!user) return <Navigate to="/login" replace />;

  if (!isCommunityBoardType(boardType)) {
    return <Navigate to="/board/free" replace />;
  }

  if (isPending) return <p role="status" className="mt-10 text-center text-sm text-textSub">글쓰기 정보를 불러오는 중입니다.</p>;

  if (isError) {
    return (
      <RetryErrorState
        message="글쓰기 정보를 불러오지 못했습니다."
        isRetrying={isFetching}
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return <PostForm mode="create" boardType={boardType} onSubmit={handleSubmit} />;
}
