import type { Dispatch, SetStateAction } from "react";
import { BaseButton } from "../ui/BaseButton";
import { ArrowUpDown } from "lucide-react";

type SortButtonGroupProps = {
    posts?: readonly unknown[];
    dateSort: boolean;
    setDateSort: Dispatch<SetStateAction<boolean>>;
};

export default function SortButtonGroup({
    posts,
    dateSort,
    setDateSort
}: SortButtonGroupProps) {
    const postCount = posts?.length ?? 0;

    return (
        <div className="flex justify-between items-center">
            <p className="text-xs md:text-base">Total <b className="inline-flex items-center py-0.5 px-1.5 rounded-full text-xs font-medium bg-red-500 text-white">{postCount}</b></p>
            <div className="flex justify-center items-center gap-2">
                <BaseButton variant="cancel" onClick={() => setDateSort((previous) => !previous)}>
                    <ArrowUpDown className="shrink-0 size-4 text-gray-600 dark:text-white/60" />
                    {dateSort ? "오래된 순" : "최신 순"}
                </BaseButton>
            </div>
        </div>
    )
}
