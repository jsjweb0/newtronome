import {useNavigate, useParams, Navigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {usePosts} from "../../contexts/postsContext.jsx";
import {useToast} from "../../contexts/ToastContext.jsx";
import {useAuth} from "../../contexts/AuthContext.jsx";
import PostForm from "../../components/board/PostForm.jsx";
import {useNotifications} from "../../contexts/NotificationContext.jsx";

export default function EditPostPage() {
    const {boardType, id} = useParams();
    const {getPosts, updatePost} = usePosts();
    const navigate = useNavigate();
    const {showToast} = useToast();
    const {addNotification} = useNotifications();
    const {user} = useAuth();
    const [post, setPost] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            const posts = await getPosts(boardType);
            const found = posts.find(p => String(p.id) === id);
            setPost(found);
        };
        fetchPost();
    }, [boardType, id]);

    const handleEdit = async (updatedPost) => {
        // 수정된 필드만 골라서 넘기기
        const now = new Date().toISOString();
        const changedFields = {
            title: updatedPost.title,
            content: updatedPost.content,
            ...(updatedPost.category && {category: updatedPost.category}),
            ...(typeof updatedPost.isNotice !== "undefined" && {isNotice: updatedPost.isNotice}),
            updatedAt: now,
        };
        const notificationId = Date.now();
        const notification = { notificationId, message: '게시글이 수정되었습니다.' };

        await updatePost(boardType, id, changedFields);

        showToast({ message: notification.message });
        addNotification(notification);

        navigate(`/board/${boardType}`);
    };

    if (post === undefined) return <p>게시글이 존재하지 않습니다.</p>;

    const canEdit = user && (user.email === post?.email || user.email === "admin@email.com");

    if (post && !canEdit) {
        return <Navigate to={`/board/${boardType}`} replace/>;
    }

    return (
        <PostForm mode="edit" boardType={boardType} initialData={post} onSubmit={handleEdit}/>
    )
}