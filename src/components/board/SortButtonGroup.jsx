import {BaseButton} from "../ui/BaseButton.jsx";
import { ArrowUpDown, RotateCcw } from "lucide-react";

export default function SortButtonGroup({ posts, toastRef, setPosts, initialNotice, dateSort, setDateSort }) {
    const postCount = posts?.length ?? 0;
    /*const resetPosts = () => {
        if(window.confirm("초기화 하시겠습니까?")) {
            localStorage.removeItem('notices');
            setPosts(initialNotice);
            showToast({message:"목록이 초기화 되었습니다."});
        }
    }*/
    return (
        <div className="flex justify-between items-center">
            <p className="text-xs md:text-base">Total <b className="inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium bg-red-500 text-white">{postCount}</b></p>
            <div className="flex justify-center items-center gap-2">
                <BaseButton variant="cancel" onClick={() => setDateSort(!dateSort)}>
                    <ArrowUpDown className="shrink-0 size-4 text-gray-600 dark:text-white/60" />
                    {dateSort ? "오래된 순" : "최신 순"}
                </BaseButton>
                {/*<BaseButton variant="cancel" onClick={resetPosts}>
                    <RotateCcw className="shrink-0 size-4 text-gray-600 dark:text-white/60" />
                    초기화
                </BaseButton>*/}
            </div>
        </div>
    )
}