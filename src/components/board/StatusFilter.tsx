import type { Dispatch, SetStateAction } from "react";
import { BaseButton } from "../ui/BaseButton";
import { HeartHandshake } from "lucide-react";

export type StatusFilterValue =
    | ""
    | "보호중"
    | "종료(반환)";

type StatusFilterProps = {
    statusFilter: StatusFilterValue;
    setStatusFilter: Dispatch<SetStateAction<StatusFilterValue>>;
};

const options: ReadonlyArray<{
    code: StatusFilterValue;
    label: string;
}> = [
        { code: "", label: "전체" },
        { code: "보호중", label: "보호중" },
        { code: "종료(반환)", label: "종료" }, // API 응답에 따라 수정
    ];

export default function StatusFilter({ statusFilter, setStatusFilter }: StatusFilterProps) {

    return (
        <div className="flex items-center gap-x-3.5 py-2 px-3">
            <span className="shrink-0 inline-flex items-center max-md:mb-3 text-stone-500 text-sm dark:text-neutral-500">
                <HeartHandshake className="shrink-0 size-4 mr-1.5" />
                상태
            </span>
            <div className="flex gap-x-2">
                {options.map(opt => (
                    <BaseButton
                        key={opt.code}
                        className="md:text-sm!"
                        variant={statusFilter === opt.code ? "primary" : "cancel"}
                        onClick={() => setStatusFilter(opt.code)}
                    >
                        {opt.label}
                    </BaseButton>
                ))}
            </div>
        </div>
    );
}
