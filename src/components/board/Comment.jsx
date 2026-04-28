import dayjs from "dayjs";
import {useEffect, useRef, useState} from "react";
import {useToast} from "../../contexts/ToastContext.jsx";
import {useNotifications} from "../../contexts/NotificationContext.jsx";
import {doc, updateDoc, getDoc, arrayUnion, arrayRemove, increment, deleteDoc} from "firebase/firestore";
import {db} from "../../firebase";
import {useAuth} from "../../contexts/AuthContext.jsx";
import {BaseButton} from "../ui/BaseButton.jsx";
import {Ellipsis, PenLine, ThumbsUp, Trash2} from "lucide-react";
import {AuthAccess} from "../auth/AuthAccess.jsx";
import LikeButton from "../ui/LikeButton.jsx";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";

export default function Comment({
                                    idx,
                                    data,
                                    boardType,
                                    postId,
                                    comments,
                                    setComments,
                                    openDropdownId,
                                    setOpenDropdownId,
                                }) {
    const {user} = useAuth();
    const {showToast} = useToast();
    const {addNotification} = useNotifications();
    const [showConfirm, setShowConfirm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(data.content);
    const editTextareaRef = useRef(null);

    const writerName = data.displayName || data.writerEmail || data.writerUid;
    const fallbackAvatar = writerName
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(writerName)}&size=128&length=1&background=random&color=ffffff&font-size=0.5&bold=true&uppercase=true`
        : null;
    const validPhotoURL =
        data.photoURL && data.photoURL.trim() !== ""
            ? data.photoURL
            : fallbackAvatar;

    const toggleDropdown = (id) => {
        setOpenDropdownId(prev => prev === id ? null : id);
    };

    const handleEditClick = (id) => {
        setOpenDropdownId(null);

        setIsEditing(id); // 수정 모드로 전환
        setEditText(data.content); // 기존 댓글 내용 채우기
    }

    useEffect(() => {
        if (isEditing && editTextareaRef.current) {
            editTextareaRef.current.focus();
        }
    }, [isEditing]);

    const handleEditSubmit = async () => {
        const commentRef = doc(
            db,
            boardType,
            postId.toString(),
            "comments",
            data.id
        );

        const notificationId = Date.now();
        const notification = { notificationId, message: '댓글이 수정되었습니다.' };
        const notificationErr = { notificationId, message: '수정에 실패했습니다.' };

        try {
            await updateDoc(commentRef, { content: editText });

            setComments(comments.map(c =>
                c.id === data.id ? { ...c, content: editText } : c
            ));
            setIsEditing(null);
            showToast({ message: notification.message });
            addNotification(notification);
        } catch (error) {
            showToast({ message: notificationErr.message, type: 'error' });
            addNotification(notificationErr);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(null);  // 수정 모드 종료
        setEditText('');  // 수정된 텍스트 초기화
    };

    const handleDelete = async (id) => {
        //if (!window.confirm("정말 삭제하시겠습니까?")) return;
        setShowConfirm(false);
        setOpenDropdownId(null);

        const notificationId = Date.now();
        const notification = { notificationId, message: '댓글이 삭제되었습니다.' };
        const notificationErr = { notificationId, message: '삭제에 실패했습니다.' };

        try {
            await deleteDoc(doc(db, data.boardType, data.postId.toString(), "comments", data.id));
            setComments(comments.filter(c => c.id !== id));

            showToast({ message: notification.message });
            addNotification(notification);
        } catch (error) {
            showToast({ message: notificationErr.message, type: 'error' });
            addNotification(notificationErr);
        }
    };

    return (
        <div className="flex items-start gap-4 mb-6 px-0 md:pt-3 md:px-5">
            <div className={`shrink-0 flex items-center justify-center`}>
                <img src={validPhotoURL || null} alt={writerName} className="size-12 rounded-full"/>
            </div>
            <div className="grow">
                <div className="flex items-center gap-x-3 max-md:flex-wrap">
                    <strong
                        className="inline-block text-sm md:text-base font-medium text-gray-500 dark:text-neutral-500">
                        {data.displayName || data.writerEmail}
                    </strong>
                    <p className="mt-1 text-xs md:text-sm uppercase text-gray-500 dark:text-neutral-500">
                        {dayjs(data.createdAt).format("YYYY-MM-DD A hh:mm:ss")}
                        <span
                            className="inline-block ml-2">
                            {dayjs(data.createdAt).fromNow()}
                        </span>
                    </p>
                </div>
                {/* 댓글 내용 수정 폼 */}
                {isEditing === data.id ? (
                    <div className="relative mt-4">
                      <textarea
                          className="resize-none p-3 md:p-4 pb-12 md:pb-12 block w-full border-gray-200 rounded-lg text-xs md:text-base focus:border-blue-500 focus:ring-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          ref={editTextareaRef}
                          placeholder="내용을 입력해주세요."/>
                        <div
                            className="inline-flex gap-1.5 absolute bottom-0 right-0 p-2">
                            <BaseButton type="button" className="!py-2"
                                        onClick={handleEditSubmit}
                            >
                                수정
                            </BaseButton>
                            <BaseButton variant="cancel"
                                        type="button"
                                        className="!py-2"
                                        onClick={handleCancelEdit}
                            >
                                취소
                            </BaseButton>
                        </div>
                    </div>
                ) : (
                    <div className="mt-3">
                        <div className="text-sm md:text-base whitespace-pre-wrap text-gray-800 dark:text-neutral-200">
                            {data.content}
                        </div>
                        <div className="flex items-center gap-6 mt-3">
                            <LikeButton type="thumb"
                                        collection={boardType}
                                        parentId={postId}
                                        subCollection="comments"
                                        docId={data.id}
                                        showCount
                            />
                            <button type="button"
                                    className="text-xs md:text-sm text-gray-500 hover:text-gray-800 focus:outline-hidden focus:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200">
                                Reply
                            </button>
                            <AuthAccess allow={["admin", data.writerEmail]}>
                                {/* dropdown menu */}
                                <div
                                    className="relative mt-[2px]">
                                    <button id={"commentMenu" + idx}
                                            type="button"
                                            className="group flex justify-center items-center size-7 text-sm font-semibold rounded-lg bg-white text-gray-800 hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border dark:border-neutral-700 dark:text-white dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
                                            onClick={() => toggleDropdown(data.id)}
                                            aria-haspopup="menu"
                                            aria-expanded={openDropdownId === data.id ? "true" : "false"}
                                            aria-label="Dropdown"
                                    >
                                        <Ellipsis className="size-5 text-gray-600 dark:text-neutral-500"/>
                                        <span
                                            className="pacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity inline-block absolute z-10 left-1/2 -translate-x-1/2 -translate-y-full py-1 px-2 bg-gray-900 text-xs font-medium text-white rounded-md shadow-2xs dark:bg-neutral-700"
                                            role="tooltip">
                                        Menu
                                    </span>
                                    </button>

                                    <div
                                        className={`transition-all duration-200 transform origin-top-right z-999 absolute top-7 w-30 h-fit bg-white shadow-md rounded-lg dark:bg-neutral-800 dark:border dark:border-neutral-700 ${
                                            openDropdownId === data.id ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95"
                                        }`}
                                        role="menu" aria-orientation="vertical"
                                        aria-labelledby={data.postId + idx}>
                                        <div className="p-1 space-y-0.5">
                                            <button type="button"
                                                    className="flex items-center gap-x-3.5 w-full py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700"
                                                    onClick={() => handleEditClick(data.id)}
                                            >
                                                <PenLine className="shrink-0 size-4"/>
                                                수정
                                            </button>
                                            <button type="button"
                                                    className="flex items-center gap-x-3.5 w-full py-2 px-3 rounded-lg text-sm text-gray-800 hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700"
                                                    onClick={() => setShowConfirm(true)}
                                            >
                                                <Trash2 className="shrink-0 size-4"/>
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {/* dropdown menu */}
                            </AuthAccess>
                        </div>
                    </div>
                )}
            </div>
            <ConfirmDialog
                isOpen={showConfirm}
                labelledby="deleteConfirm"
                title="삭제"
                message={`댓글이 삭제되었습니다.`}
                onConfirm={() => handleDelete(data.id)}
                onDismiss={() => setShowConfirm(false)}
            />
        </div>
    )
}