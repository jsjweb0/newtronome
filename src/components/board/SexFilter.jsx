import {BaseButton} from "../ui/BaseButton.jsx";
import {VenusAndMars} from "lucide-react";

export default function SexFilter({ sexFilter, setSexFilter }) {
    const options = [
        { code: "", label: "전체" },
        { code: "M", label: "수컷" },
        { code: "F", label: "암컷" },
        { code: "Q", label: "미상" },
    ];

    return (
        <div className="flex items-center gap-x-3.5 mb-3 py-2 px-3">
            <span className="shrink-0 inline-flex items-center max-md:mb-3 text-stone-500 text-sm dark:text-neutral-500">
                <VenusAndMars className="shrink-0 size-4 mr-1.5" />
              성별
            </span>
            <div className="flex gap-x-2">
                {options.map(opt => (
                    <BaseButton
                        key={opt.code}
                        className="md:!text-sm"
                        variant={sexFilter === opt.code ? "primary" : "cancel"}
                        onClick={() => setSexFilter(opt.code)}
                    >
                        {opt.label}
                    </BaseButton>
                ))}
            </div>
        </div>
    );
}
