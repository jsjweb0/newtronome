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
  const { mutateAsync: createPost } = useCreatePost();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (
    formData: PostFormValues
  ): Promise<void> => {
    if (!user || !isCommunityBoardType(boardType)) return;

    const newPost: CreatePostInput = {
      ...formData,
      content: formData.content,
      authorUid: user.uid,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
    };

    try {
      const postId = await createPost({
        boardType,
        input: newPost,
      });

      showToast({ message: '게시글이 등록되었습니다!' });
      addNotification({
        notificationId: Date.now(),
        message: '게시글이 등록되었습니다!',
      });

      navigate(`/board/${boardType}/${postId}`);
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

  return <PostForm mode="create" boardType={boardType} onSubmit={handleSubmit} />;
}
