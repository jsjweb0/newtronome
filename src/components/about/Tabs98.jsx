import React, {useEffect, useId, useRef, useState} from "react";

export default function Tabs98({
                                   tabs = [],             // [{id:'projects', label:'Projects', content: <div/>}, ...]
                                   defaultIndex = 0,
                                   onChange,
                                   className = "",
                               }) {
    const [active, setActive] = useState(defaultIndex);
    const listRef = useRef(null);
    const baseId = useId();

    useEffect(() => {
        onChange?.(active);
    }, [active, onChange]);

    const focusTab = (idx) => {
        const el = listRef.current?.querySelectorAll('[role="tab"]')[idx];
        el?.focus();
    };

    const onKeyDown = (e) => {
        if (!tabs.length) return;
        const last = tabs.length - 1;
        if (e.key === "ArrowRight") {
            e.preventDefault();
            const next = active === last ? 0 : active + 1;
            setActive(next);
            focusTab(next);
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            const prev = active === 0 ? last : active - 1;
            setActive(prev);
            focusTab(prev);
        } else if (e.key === "Home") {
            e.preventDefault();
            setActive(0);
            focusTab(0);
        } else if (e.key === "End") {
            e.preventDefault();
            setActive(last);
            focusTab(last);
        }
    };

    return (
        <div className={className}>
            {/* 탭 리스트 */}
            <menu
                role="tablist"
                ref={listRef}
                onKeyDown={onKeyDown}
            >
                {tabs.map((t, i) => {
                    const tabId = `${baseId}-tab-${t.id}`;
                    const panelId = `${baseId}-panel-${t.id}`;
                    const selected = i === active;
                    return (
                        <li key={t.id} aria-selected={selected ? "true" : "false"}>
                            {/* a 대신 button 사용 (내비게이션 방지) */}
                            <button
                                role="tab"
                                id={tabId}
                                aria-controls={panelId}
                                aria-selected={selected}
                                tabIndex={selected ? 0 : -1}
                                onClick={() => setActive(i)}
                                style={{
                                    boxShadow: "none",
                                    margin: "6px",
                                    textShadow: "none",
                                    color: "#222",
                                    minHeight: "auto",
                                    minWidth: "auto",
                                    padding: "0 4px",
                            }}
                            >
                                {t.label}
                            </button>
                        </li>
                    );
                })}
            </menu>

            {/* 탭 패널 (선택된 것만 렌더) */}
            {tabs.map((t, i) => {
                const tabId = `${baseId}-tab-${t.id}`;
                const panelId = `${baseId}-panel-${t.id}`;
                const selected = i === active;
                return (
                    <div
                        key={t.id}
                        role="tabpanel"
                        id={panelId}
                        aria-labelledby={tabId}
                        hidden={!selected}
                        className="window w-full has-[pre]:!shadow-none"
                    >
                        <div className="window-body py-2 has-[pre]:!m-0 !p-0">{t.content}</div>
                    </div>
                );
            })}

            <div className="flex justify-end gap-x-1 mt-2">
                <button className="default">확인</button>
                <button>취소</button>
            </div>
        </div>
    );
}
