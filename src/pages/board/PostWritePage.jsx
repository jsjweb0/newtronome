import { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { usePosts } from '../../contexts/usePosts.js';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import PostForm from '../../components/board/PostForm.jsx';
import { useNotifications } from '../../contexts/NotificationContext';

export default function PostWritePage() {
  const { boardType } = useParams();
  const { getPosts, createPost } = usePosts();
  const { showToast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [nextPostNo, setNextPostNo] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      const data = await getPosts(boardType);
      const postNumbers = data
        .map((post) => Number(post.postNo))
        .filter((postNo) => Number.isFinite(postNo));
      const maxPostNo = postNumbers.length ? Math.max(...postNumbers) : 0;
      setNextPostNo(maxPostNo + 1);
    };
    fetchPosts();
  }, [boardType, getPosts]);

  const handleSubmit = (formData) => {
    const newPost = {
      ...formData,
      postNo: nextPostNo,
      content: formData.content.replace(/\n/g, '<br>'),
      date: new Date(),
      email: user.email,
      authorUid: user.uid,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null,
    };

    const notificationId = Date.now();
    const notification = { notificationId, message: '게시글이 등록되었습니다!' };
    const notificationErr = { notificationId, message: '글 등록에 실패했습니다.' };

    createPost(boardType, newPost)
      .then(() => {
        showToast({ message: notification.message });
        addNotification(notification);
        navigate(`/board/${boardType}`);
      })
      .catch((err) => {
        console.error(err);
        showToast({ message: notificationErr.message, type: 'error' });
        addNotification(notificationErr);
      });
  };

  if (!user) return <Navigate to="/login" replace />;

  return <PostForm mode="create" boardType={boardType} onSubmit={handleSubmit} />;
}
