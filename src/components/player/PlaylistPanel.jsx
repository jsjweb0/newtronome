import {Link} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import {DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
    restrictToVerticalAxis,
    restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import {getArtworkOrFallback} from "../../utils/image.js";
import {formatTime, formatCount} from "../../utils/format.js";
import HeaderButtons from "../layout/HeaderButtons.jsx";
import LikeButton from "../ui/LikeButton.jsx";
import Tooltip from "../ui/Tooltip.jsx";
import {AudioEqualizerIcon} from "../icons/index.js"
import {Trash2, Play, ListCheck, ListPlus, X as EditX} from "lucide-react";
import noImage from "../../assets/no-image.png";
import clsx from "clsx";
import SortableItem from "./SortableItem.jsx";
import {useToast} from "../../contexts/useToast.js";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";

export default function PlaylistPanel({tracks, currentIndex, onSelect, collapsed, isPlaying, onReorder}) {
    const {showToast} = useToast();
    const [showConfirm, setShowConfirm] = useState(false);
    const [saveConfirm, setSaveConfirm] = useState(false);
    const track = tracks[currentIndex];
    const raw = track?.tag_list || "";
    const tokens = raw.match(/"[^"]+"|\S+/g) || [];
    const tags = tokens.map(tag => tag.replace(/^"|"$/g, ""));

    // 로컬 복사본
    const [items, setItems] = useState(tracks);
    useEffect(() => setItems(tracks), [tracks]);

    // 편집 모드 여부
    const [isEditing, setIsEditing] = useState(false);
    // 선택된 아이템 ID 리스트
    const [selectedIds, setSelectedIds] = useState([]);
    // 드래그 중인 아이디
    const [activeId, setActiveId] = useState(null);
    // 패널 스크롤 컨테이너 ref
    const panelRef = useRef(null);
    useEffect(() => {
        if (isEditing && panelRef.current) {
            panelRef.current.scrollTo({ top: 0, behavior: "smooth" });
        }

        if (isEditing) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.removeProperty("overflow");
        }
        return () => {
            document.body.style.removeProperty("overflow");
        };
    }, [isEditing]);

    const sensors = useSensors(useSensor(PointerSensor, { autoScroll: false }));

    // 드래그 시작
    const handleDragStart = ({active}) => setActiveId(active.id);

    // 드래그 종료
    const handleDragEnd = ({active, over}) => {
        if (over && active.id !== over.id) {
            setItems((prev) => {
                const oldIndex = prev.findIndex((i) => i.id === active.id);
                const newIndex = prev.findIndex((i) => i.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    // 드래그 취소
    const handleDragCancel = () => setActiveId(null);

    // 체크박스 토글
    const toggleSelect = id => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const selectedCount = selectedIds.length;
    const allSelected = selectedCount === items.length && items.length > 0;
    const toggleSelectAll = () => {
        if (allSelected) setSelectedIds([]);
        else setSelectedIds(items.map(item => item.id));
    };

    // 저장 & 취소
    const handleSave = () => {
        setSaveConfirm(false);
        onReorder(items);
        setIsEditing(false);
        setSelectedIds([]);
        showToast({message: '재생목록이 수정되었습니다.', type: 'success'});
    };
    const handleCancel = () => {
        setItems(tracks);
        setIsEditing(false);
        setSelectedIds([]);
    };

    // 삭제: 선택된 ID 제거
    const handleDelete = () => {
        //if (!window.confirm(`${selectedCount}곡을 재생목록에서 삭제하시겠습니까?`)) return;
        setShowConfirm(false);
        setItems(prev => prev.filter(item => !selectedIds.includes(item.id)));
        setSelectedIds([]);
        showToast({message: '곡이 삭제되었습니다.', type: 'success'});
    };

    // 오버레이에 렌더링할 아이템 찾기
    const activeTrack = items.find((i) => i.id === activeId);

    return (
        <aside
            className={clsx(
                "z-51 fixed top-0 lg:top-3 right-0 lg:right-3 h-full xl:max-h-[calc(100%-116px-2.25rem)] transform transition-transform duration-300 w-full max-w-md lg:max-w-[300px] rounded-2xl",
                collapsed
                    ? "translate-x-0"
                    : "translate-x-full",
                isEditing && "z-500"
            )}>
            <div className={`flex flex-col gap-3 h-full ${collapsed ? "" : "hidden"}`}>
                <div className={clsx(
                    "hidden lg:block shrink-0 z-[2] relative px-4 py-2 bg-background rounded-2xl transition-transform transition-duration-350",
                    "border border-textThr dark:border-none",
                    collapsed
                        ? "translate-x-0"
                        : "translate-x-[calc(100%-4.5rem)]"
                )}>
                    <HeaderButtons collapsed={collapsed}/>
                </div>
                <div
                    className={clsx(
                        "overflow-y-auto grow relative bg-background rounded-2xl scrollbar transition-all transition-duration-600",
                        "max-xl:pb-28",
                        "border border-textThr dark:border-none",
                        collapsed
                            ? "translate-x-0 opacity-100"
                            : "translate-x-full opacity-0",
                        isEditing && "max-xl:!pb-2"
                    )}>
                    <h3 className="text-lg font-semibold text-textBase mb-4 sr-only">Now Playing</h3>

                    {/* top cover*/}
                    {!isEditing && (
                        <div ref={panelRef} className="flex flex-col gap-y-2 p-4">
                            <div>
                                <img src={getArtworkOrFallback(track?.artwork)}
                                     alt={track?.title}
                                     className="w-full rounded-2xl object-cover"
                                     onError={(e) => {
                                         e.target.src = noImage;
                                         e.target.onerror = null;
                                     }}
                                />
                            </div>
                            <div className="mt-2 text-xs text-textSub">{track?.genre}</div>
                            <div className="text-lg font-black">{track?.title}</div>
                            <div>{track?.artist}</div>
                            <div className="flex items-center gap-x-2 mt-4 text-xs text-textSub">
                                <LikeButton docId={String(track?.id)} collection="tracks"
                                            className="size-8 rounded-lg border border-textThr dark:border-none dark:bg-textThr mr-2 text-textBase"
                                />Likes
                                <i className="inline-block w-1 h-1 rounded-full bg-textSub"></i>
                                <Play
                                    className="size-3 fill-textBase stroke-none"/>{formatCount(track?.playback_count)} Plays
                            </div>
                            <ul className="flex flex-wrap gap-2 mt-2">
                                {tags.slice(0, 5).map(tag => (
                                    <li key={tag}>
                                        <Link to={`/search?q=${encodeURIComponent(tag)}`}
                                              className="inline-block px-2 py-1 text-xs rounded-full bg-textThr text-textSub hover:text-primary hover:bg-primary/6"
                                        >
                                            # {tag}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-6 p-4">
                        <div className="flex items-center justify-between mb-2 pb-2.5 border-b border-b-textThr">
                            <h4 className="font-semibold">All Playlists</h4>
                            {isEditing ? (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const a = JSON.stringify(tracks.map(t => t.id));
                                            const b = JSON.stringify(items.map(t => t.id));
                                            if (a === b) {
                                                console.log('1');
                                                showToast({message: "변경사항이 없습니다.", type: "warning"});
                                            } else {
                                                setSaveConfirm(true);
                                            }
                                        }}
                                        className="flex items-center gap-x-1 text-sm"
                                    >
                                        <ListCheck className="size-5"/> 완료
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex items-center gap-x-1 text-sm"
                                    >
                                        <EditX className="size-5"/> 취소
                                    </button>
                                </div>
                            ) : (
                                <Tooltip content="편집">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-x-1 text-sm"
                                        aria-label="재생목록 편집"
                                    >
                                        <ListPlus className="size-5"/>
                                    </button>
                                </Tooltip>
                            )}
                        </div>

                        {isEditing ? (
                            //드래그앤드롭 활성화
                            <DndContext
                                sensors={sensors}
                                modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onDragCancel={handleDragCancel}
                                autoScroll={false}
                            >
                                <div className="flex items-center gap-x-2.5 mb-2.5">
                                    <input type="checkbox"
                                           className="shrink-0 mt-0.5 border-gray-300 rounded-sm focus:ring-primary checked:border-primary checked:bg-primary disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-800 dark:border-neutral-600"
                                           id="seletedAll"
                                           checked={allSelected}
                                           onChange={toggleSelectAll}
                                    />
                                    <label htmlFor="seletedAll" className="text-gray-700 dark:text-neutral-300">전체(<b
                                        className="font-inter">{items.length}</b>)</label>
                                </div>
                                <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                                    <ol className="space-y-2">
                                        {items.map(track => (
                                            <SortableItem
                                                key={track.id}
                                                id={track.id}
                                                track={track}
                                                isEditing={true}
                                                isSelected={selectedIds.includes(track.id)}
                                                onToggleSelect={() => toggleSelect(track.id)}
                                            />
                                        ))}
                                    </ol>
                                </SortableContext>

                                <DragOverlay wrapperElement="ul">
                                    {activeTrack ? (
                                        <div className="shadow-lg rounded-lg  backdrop-blur-[4px]">
                                            <SortableItem
                                                id={activeTrack.id}
                                                track={activeTrack}
                                                hideListeners
                                            />
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>
                        ) : (
                            <ol className="space-y-2">
                                {tracks.length > 0 ? (
                                    tracks.map((track, idx) => (
                                        <li
                                            key={`${track.id}-${idx}`}
                                            className={`max-w-full ${
                                                idx === currentIndex ? "text-primary" : ""
                                            }`}
                                            onClick={() => {
                                                // 여기에 곡 선택 로직 넣을 수 있음 (ex: setCurrentTrack(track))
                                                onSelect(idx);
                                                console.log(`Play: ${track.title}`);
                                            }}
                                        >
                                            <button type="button"
                                                    className={`group grid grid-cols-[3rem_auto] grid-rows-3 gap-x-3 justify-items-center items-center w-full max-w-full text-left hover:text-primary ${
                                                        idx === currentIndex ? "isActive" : ""
                                                    }
                                        `}>
                                            <span
                                                className="row-span-3 overflow-hidden flex relative w-12 h-12 rounded-lg">
                                                <img src={track.artwork} alt={track.title} className="object-cover"/>
                                                <i className="hidden group-[.isActive]:flex justify-center items-center absolute w-full h-full bg-primary/45">
                                                    {isPlaying && (
                                                        <AudioEqualizerIcon isPlaying={true} className="text-white"/>
                                                    )}
                                                </i>
                                            </span>
                                                <span
                                                    className="block w-full col-start-2 text-sm text-textBase truncate group-hover:text-primary group-[.isActive]:text-primary">{track.title}</span>
                                                <span
                                                    className="col-start-2 row-start-2 block w-full text-[11px] text-textSub truncate group-hover:text-primary group-[.isActive]:text-primary">{track.artist}</span>
                                                <span
                                                    className="col-start-2 row-start-3 flex items-center gap-1 w-full text-[11px] text-left text-textSub">
                                                <Play
                                                    className="size-2.5 fill-textBase stroke-none group-hover:fill-primary font-inter"/>{formatCount(track?.playback_count)}
                                                    <i className="inline-block w-[2px] h-[2px] mx-1 rounded-full bg-textSub font-inter"></i>{formatTime(track.duration)}
                                            </span>
                                            </button>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-sm text-gray-500">플레이리스트가 비어 있어요</li>
                                )}
                            </ol>
                        )}
                    </div>
                    {(isEditing && selectedCount > 0) && (
                        <div
                            className="flex justify-between sticky bottom-0 w-full py-3 px-5 rounded-xl text-sm duration-350 animate-fade-slide-in border border-textThr bg-white dark:border-none dark:bg-textThr">
                            <div className="text-gray-500 dark:text-neutral-400">
                                <span className="text-primary font-semibold font-inter">{selectedCount}</span> 곡 선택
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowConfirm(true)}
                                disabled={selectedCount === 0}
                                className={clsx(
                                    "flex items-center gap-x-1",
                                    selectedCount === 0 && "opacity-50 pointer-events-none"
                                )}
                            >
                                <Trash2 className="size-4"/> 삭제
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <ConfirmDialog
                isOpen={showConfirm}
                labelledby="deleteConfirm"
                title="삭제"
                message={`${selectedCount}곡을 재생목록에서 삭제하시겠습니까?`}
                onConfirm={handleDelete}
                onDismiss={() => setShowConfirm(false)}
            />
            <ConfirmDialog
                isOpen={saveConfirm}
                labelledby="saveConfirm"
                title="확인"
                message="재생목록을 수정하시겠습니까?"
                onConfirm={handleSave}
                onDismiss={() => setSaveConfirm(false)}
            />
        </aside>
    );
}
