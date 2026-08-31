import type { Dispatch, SetStateAction } from "react";
import { Dog } from "lucide-react";
import { BaseButton } from "../ui/BaseButton";

export type AnimalKind = "all" | "dog" | "cat" | "etc";

type AnimalKindFilterProps = {
    filter: AnimalKind;
    setFilter: Dispatch<SetStateAction<AnimalKind>>;
}

const kinds: ReadonlyArray<{
    label: string;
    value: AnimalKind;
}> = [
        { label: "전체", value: "all" },
        { label: "개", value: "dog" },
        { label: "고양이", value: "cat" },
        { label: "기타", value: "etc" },
    ];

export default function AnimalKindFilter({ filter, setFilter }: AnimalKindFilterProps) {

    return (
        <div className="flex items-center gap-x-3.5 mb-3 py-2 px-3">
            <span className="shrink-0 inline-flex items-center max-md:mb-3 text-stone-500 text-sm dark:text-neutral-500">
                <Dog className="shrink-0 size-4 mr-1.5" /> 축종
            </span>
            <div className="flex gap-x-2">
                {kinds.map((kind) => (
                    <BaseButton
                        key={kind.value}
                        className="md:text-sm!"
                        onClick={() => setFilter(kind.value)}
                        variant={filter === kind.value ? "primary" : "cancel"}
                    >
                        {kind.label}
                    </BaseButton>
                ))}
            </div>
        </div>
    );
}
