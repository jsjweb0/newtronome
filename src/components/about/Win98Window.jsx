import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function Win98Window({
                                        id,
                                        icon,
                                        title,
                                        minimized = false,
                                        onMinimize,
                                        children,
                                        onFocus,
                                        zIndex = 1,
                                        className = "",
                                        showMaximize = true,
                                        showRestore = false,
                                        showHelp = false,
                                        isActive,
                                    }) {
    const wrapperRef = useRef(null);
    const bodyRef = useRef(null);
    const [height, setHeight] = useState("auto");
    const [isAnimating, setIsAnimating] = useState(false);
    const iconSrc = icon
        ? (icon.startsWith("/") ? icon : `/images/icon/png/${icon}.png`)
        : null;

    // 최초 세팅
    useLayoutEffect(() => {
        if (!wrapperRef.current) return;
        setHeight(minimized ? "0px" : "auto");
    }, []);

    // minimized prop 변경될 때 애니메이션
    useEffect(() => {
        const wrapper = wrapperRef.current;
        const body = bodyRef.current;
        if (!wrapper || !body) return;

        const current = wrapper.getBoundingClientRect().height;
        const content = body.getBoundingClientRect().height;

        // 시작점 고정
        wrapper.style.height = `${current}px`;
        // 리플로우
        // eslint-disable-next-line no-unused-expressions
        wrapper.offsetHeight;

        setIsAnimating(true);
        setHeight(minimized ? "0px" : `${current}px`);
    }, [minimized]);

    const onTransitionEnd = () => {
        setIsAnimating(false);
        if (!minimized) setHeight("auto");
    };

    return (
        <div
            className={`window inline-flex flex-col ${className} ${isActive ? "is-active" : ""}`}
            onMouseDown={() => onFocus?.(id)}
        >
            <div className={`title-bar ${!isActive && "inactive"}`}>
                <div className="title-bar-text">
                    {icon && <img src={iconSrc} alt="" className="mr-1" aria-hidden="true" />}
                    {title}
                </div>
                <div className="title-bar-controls">
                    <button aria-label="Minimize" onClick={() => onMinimize?.(id)} />
                    {showMaximize && (<button aria-label="Maximize" disabled />)}
                    {showRestore && (<button aria-label="Restore"></button>)}
                    {showHelp && (<button aria-label="Help"></button>)}
                    <button aria-label="Close" disabled />
                </div>
            </div>

            <div
                ref={wrapperRef}
                className="window-body-wrapper"
                style={{ height, transition: "height 200ms ease, opacity 200ms ease", overflow: "hidden", opacity: minimized ? 0 : 1 }}
                onTransitionEnd={onTransitionEnd}
                aria-hidden={minimized}
            >
                {children}
                {/*<div ref={bodyRef} className={`window-body grow ${bodyClassName}`}>
                    {children}
                </div>*/}
            </div>

            {/* 포커스 시 테두리 강조 (선택) */}
            <style>{`
        .window:focus-within .title-bar { outline: 2px dotted #000; }
      `}</style>
        </div>
    );
}