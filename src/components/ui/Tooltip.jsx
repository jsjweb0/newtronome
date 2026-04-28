import {useState, useRef, useEffect} from "react";

export default function Tooltip({
                                    enabled = true,
                                    children,
                                    content,
                                    position = "top",      // top / bottom / left / right
                                    delay = 200,           // ms
                                    className = "",
                                }) {
    const [visible, setVisible] = useState(false);
    const [offset, setOffset] = useState({x: 0, y: 0});
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined'
            ? window.matchMedia('(min-width:1025px)').matches
            : true
    );

    const showTimerRef = useRef();
    const hideTimerRef = useRef();
    const wrapperRef = useRef();

    // 뷰포트 변경 감지
    useEffect(() => {
        if (typeof window === "undefined") return;
        const mql = window.matchMedia("(min-width:1025px)");
        const onChange = (e) => setIsDesktop(e.matches);
        onChange(mql);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, []);

    // 마우스 진입 시 (데스크탑/모바일 공용으로 처리)
    const show = () => {
        // 기존 show 타이머 클리어
        clearTimeout(showTimerRef.current);
        clearTimeout(hideTimerRef.current);
        // show after delay
        showTimerRef.current = setTimeout(() => {
            setVisible(true);
            // 모바일인 경우 자동 숨김 타이머 설정
            if (!isDesktop) {
                hideTimerRef.current = setTimeout(() => {
                    setVisible(false);
                }, 1500);
            }
        }, delay);
    };
    // 마우스 나갈 시 (데스크탑만 hide)
    const hide = () => {
        clearTimeout(showTimerRef.current);
        clearTimeout(hideTimerRef.current);
        setVisible(false);
    };

    // 위치 계산
    useEffect(() => {
        if (!visible || !wrapperRef.current) return;

        // next frame에서 위치 계산
        requestAnimationFrame(() => {
            const wrapper = wrapperRef.current;
            const tooltip = wrapper.querySelector(".tooltip-content");
            if (!tooltip) return;

            const rect = wrapper.getBoundingClientRect();
            const tRect = tooltip.getBoundingClientRect();

            let x = 0, y = 0;
            switch (position) {
                case "top":
                    x = rect.width / 2 - tRect.width / 2;
                    y = -tRect.height - 8;
                    break;
                case "bottom":
                    x = rect.width / 2 - tRect.width / 2;
                    y = rect.height + 8;
                    break;
                case "left":
                    x = -tRect.width - 8;
                    y = rect.height / 2 - tRect.height / 2;
                    break;
                case "right":
                    x = rect.width + 8;
                    y = rect.height / 2 - tRect.height / 2;
                    break;
            }

            setOffset({x, y});
        });
    }, [visible, position]);

    if (!enabled) return <>{children}</>;

    return (
        <div
            ref={wrapperRef}
            className={`relative inline-flex ${className}`}
            onMouseEnter={show}
            onMouseLeave={hide}
        >
            {children}
            {visible && (
                <span
                    className="tooltip-content visible inline-flex absolute z-[999] px-2 py-1 bg-gray-900 text-white font-medium text-xs rounded-md shadow-2xs transition-opacity whitespace-nowrap animate-fade-in"
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px)`,
                        opacity: visible ? 1 : 0,
                    }}
                    role="tooltip"
                >
                    {content}
                </span>
            )}
        </div>
    );
}
