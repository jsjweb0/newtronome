import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {useDraggable} from "@dnd-kit/core";
import {CSS} from "@dnd-kit/utilities";
import {Tally3, } from "lucide-react";
import {getArtworkOrFallback} from "../../utils/image.js";
import clsx from "clsx";

export default function SortableItem({id, track, hideListeners, isSelected, onToggleSelect}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled: hideListeners,
        /*transition: {
            duration: 150,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
        },*/
    });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        //visibility: isDragging ? "hidden" : "visible",
    };

    return (
        <li ref={setNodeRef} style={style} className={clsx(
            "flex items-center gap-x-2.5",
            isDragging && "opacity-50 shadow-lg p-1.5"
        )}>
            <div className="flex">
                <input type="checkbox"
                       className="shrink-0 mt-0.5 border-gray-300 rounded-sm focus:ring-primary checked:border-primary checked:bg-primary disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-600"
                       id={id}
                       checked={isSelected}
                       onChange={onToggleSelect}
                />
                <label htmlFor={id} className="sr-only">선택</label>
            </div>
            {/* 트랙 정보 */}
            <div className="overflow-hidden grow flex items-center gap-x-3">
                <span
                    className="shrink-0 overflow-hidden flex relative w-12 h-12 rounded-lg">
                    <img src={getArtworkOrFallback(track.artwork)} alt={track.title} className="object-cover"/>
                </span>
                <div className="max-w-full min-w-0">
                    <span className="overflow-hidden block w-full col-start-2 text-sm text-textBase truncate">
                        {track.title}</span>
                    <span
                        className="overflow-hidden block w-full text-[11px] text-textSub truncate">
                    {track.artist}
                </span>
                </div>
            </div>
            <button type="button"
                    {...listeners}
                    {...attributes}
                    className={clsx(
                        "shrink-0 flex justify-center items-center cursor-grab size-6 text-gray-400 dark:text-neutral-400",
                        isDragging && "text-primary"
                    )}>
                <Tally3 className="size-5 rotate-90"/>
            </button>
        </li>
    );
}