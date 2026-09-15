import { useNavigate, useParams, Navigate } from 'react-router-dom';
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

export default function EditPostPage() {
  const { boardType, id } = useParams();
  const { getPosts, updatePost } = usePosts();
  const [post, setPost] = useState<Post | null | undefined>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (!id || !isCommunityBoardType(boardType)) {
      return;
    }

    const fetchPost = async () => {
      const posts = await getPosts(boardType);
      const found = posts.find(
        (post) => String(post.id) === id
      );

      setPost(found);
    };

    fetchPost();
  }, [boardType, id, getPosts]);

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

    if (user.email === 'admin@email.com') {
      changedFields.isNotice = updatedPost.isNotice;
    }

    try {
      await updatePost(boardType, id, changedFields);

      showToast({ message: '게시글이 수정되었습니다.' });
      addNotification({
        notificationId: Date.now(),
        message: '게시글이 수정되었습니다',
      });

      navigate(`/board/${boardType}`);
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
    return <p>게시글을 불러오는 중입니다.</p>;
  }

  if (post === undefined) {
    return <p>게시글이 존재하지 않습니다.</p>;
  }

  const canEdit =
    user &&
    (user.email === post.email ||
      user.email === 'admin@email.com');

  if (!canEdit) {
    return <Navigate to={`/board/${boardType}`} replace />;
  }

  return (
    <PostForm mode="edit" boardType={boardType} initialData={post} onSubmit={handleEdit} />
  );
}
