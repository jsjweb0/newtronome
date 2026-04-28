import {useEffect, useMemo, useState} from "react";
import {useAuth} from "../../contexts/useAuth.js";
import {getMyCommentsFromDB} from "../../utils/comment.js";
import {Link} from "react-router-dom";
import {ThumbsUp} from "lucide-react";
import {BaseButton} from "../ui/BaseButton.jsx";
import {useToast} from "../../contexts/useToast.js";
import {deleteDoc, doc} from "firebase/firestore";
import {db} from "../../firebase.js";
import Pagination from "./Pagination.jsx";
import {formatDate} from "../../utils/format.js";
import {getCurrentPageItems, getTotalPages} from "../../utils/pagination.js";

export default function MyCommentSection({
                                             searchKeyword,
                                             comments,
                                             setComments,
                                             currentPage,
                                             setCurrentPage,
                                             handlePageChange
                                         }) {
    const { user, loading: authLoading } = useAuth();
    const {showToast} = useToast();
    const [loading, setLoading] = useState(false);

    // 1) 마이 코멘트 로드
    useEffect(() => {
        if (authLoading) return;

        if (!user?.uid) {
            setComments([]);
            return;
        }

        setLoading(true);
        getMyCommentsFromDB(user.uid)
            .then((data) => setComments(data))
            .catch((err) => {
                console.error("❌ 내 댓글 조회 에러:", err);
                showToast({message: "댓글 로딩 중 오류가 발생했습니다.", type: "error"});
            })
            .finally(() => setLoading(false));
    }, [authLoading, user, setComments, showToast]);

    // 2) 필터 & 정렬
    const filteredComments = useMemo(() => {
        return comments
            .filter((c) =>
                c.content.toLowerCase().includes(searchKeyword.toLowerCase())
            )
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [comments, searchKeyword]);

    // 3) 페이징 계산
    const totalItems = filteredComments.length;
    const pageSize = 10;
    const totalPages = getTotalPages(totalItems, pageSize);

    // currentPage가 범위를 벗어나면 조정
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages || 1);
        }
    }, [totalPages, currentPage, setCurrentPage]);

    const currentComments = useMemo(
        () => getCurrentPageItems(filteredComments, currentPage, pageSize),
        [filteredComments, currentPage]
    );

    const handleDelete = async (c) => {
        if (!window.confirm("정말 삭제하시겠습니까?")) return;
        try {
            await deleteDoc(
                doc(db, c.boardType, c.postId.toString(), "comments", c.id)
            );
            setComments((prev) => prev.filter((x) => x.id !== c.id));
            showToast({message: "댓글이 삭제되었습니다."});
        } catch (err) {
            console.error("삭제 에러:", err);
            showToast({message: "삭제에 실패했습니다.", type: "error"});
        }
    };

    //if (loading) return <p>로딩 중…</p>;

    if (!filteredComments.length) {
        return (
            <p className="mt-4 p-4 text-center text-gray-500 text-xs md:text-base">
                작성한 댓글이 없습니다.
            </p>
        );
    }

    return (
        <>
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden text-gray-500 text-xs md:text-base text-left md:text-center dark:border-neutral-700 dark:text-neutral-400">
                {currentComments.map((c, idx) => (
                        <li key={c.id}
                            className="grid grid-cols-1 md:grid-cols-12 md:gap-2 px-4 py-3 text-xs md:text-base sm:items-center hover:bg-gray-50 dark:hover:bg-neutral-800 dark:border-neutral-700"
                        >
                            <div>{(currentPage - 1) * pageSize + idx + 1}</div>
                            <div className="md:col-span-1">
                                {c.boardType === "free"
                                    ? "자유게시판"
                                    : c.boardType === "notice"
                                        ? "공지사항"
                                        : c.boardType}
                            </div>
                            <Link
                                to={`/board/${c.boardType}/${c.postId}`}
                                className="flex items-start gap-2 md:col-span-6 text-left max-w-full py-2 font-medium text-gray-900 dark:text-white"
                            >
                                {c.content}
                            </Link>
                            <div className="md:col-span-2">
                                {formatDate(c.createdAt, true)}
                            </div>
                            <div className="flex items-center gap-2">
                                <ThumbsUp
                                    className={`shrink-0 size-4 fill-blue-600 stroke-blue-600 text-blue-600`}
                                />
                                {c.likeCount ?? 0}
                            </div>
                            <div className="max-md:mt-2">
                                <BaseButton variant="cancel"
                                            className="!px-3 !py-1"
                                            onClick={() => handleDelete(c)}
                                >
                                    삭제
                                </BaseButton>
                            </div>
                        </li>
                    )
                )}
            </ul>

            {/* 페이징 */}
            <Pagination
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

        </>
    );
}
