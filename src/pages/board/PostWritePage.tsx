import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { usePosts } from '../../contexts/PostsContext';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import PostForm, {
  type PostFormValues,
} from '../../components/board/PostForm';

import {
  isCommunityBoardType,
  type CreatePostInput,
} from '../../contexts/PostsContext';

export default function PostWritePage() {
  const { boardType } = useParams();
  const { getPosts, createPost } = usePosts();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [nextPostNo, setNextPostNo] = useState(1);
  const [isPreparing, setIsPreparing] = useState(true);
  const [prepareError, setPrepareError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isCommunityBoardType(boardType)) return;

    let ignore = false;

    const fetchPosts = async () => {
      setIsPreparing(true);
      setPrepareError('');

      try {
        const data = await getPosts(boardType);
        if (ignore) return;

        const postNumbers = data
          .map((post) => Number(post.postNo))
          .filter((postNo) => Number.isFinite(postNo));

        const maxPostNo = postNumbers.length ? Math.max(...postNumbers) : 0;
        setNextPostNo(maxPostNo + 1);
      } catch (error) {
        if (!ignore) {
          console.error('게시글 번호 조회 실패:', error);
          setPrepareError('글쓰기 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (!ignore) setIsPreparing(false);
      }
    };

    void fetchPosts();
    return () => {
      ignore = true;
    };
  }, [boardType, getPosts, retryCount]);

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
      await createPost(boardType, newPost);

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

  if (isPreparing) return <p className="mt-10 text-center">글쓰기 정보를 불러오는 중입니다.</p>;

  if (prepareError) {
    return (
      <div className="mt-10 text-center" role="alert">
        <p>{prepareError}</p>
        <button type="button" className="mt-4 text-primary" onClick={() => setRetryCount((count) => count + 1)}>
          다시 시도
        </button>
      </div>
    );
  }

  return <PostForm mode="create" boardType={boardType} onSubmit={handleSubmit} />;
}
