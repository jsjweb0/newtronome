import { ArrowUpDown } from "lucide-react";

type SortButtonGroupProps = {
    dateSort: boolean;
    setDateSort: (nextSort: boolean) => void;
};

export default function SortButtonGroup({
    dateSort,
    setDateSort
}: SortButtonGroupProps) {
    return (
        <button
            type="button"
            onClick={() => setDateSort(!dateSort)}
            className="shrink-0 inline-flex items-center gap-1.5 min-h-11 px-3.5 rounded-xl bg-field text-sm font-bold whitespace-nowrap text-textBase hover:bg-textThr focus-visible:outline-2 focus-visible:outline-primary"
        >
            <ArrowUpDown aria-hidden="true" className="shrink-0 size-4 text-textSub" />
            {dateSort ? "오래된 순" : "최신 순"}
        </button>
    )
}
