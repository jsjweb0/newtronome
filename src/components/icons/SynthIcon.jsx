const SynthIcon = ({ className = "w-5 h-5" }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* 본체 */}
        <rect x="3" y="6" width="18" height="12" rx="2" />
        {/* 버튼 라인 */}
        <line x1="7" y1="10" x2="7" y2="14" />
        <line x1="10" y1="10" x2="10" y2="14" />
        <line x1="13" y1="10" x2="13" y2="14" />
        {/* 노브 */}
        <circle cx="17" cy="10" r="0.8" />
        <circle cx="17" cy="14" r="0.8" />
        {/* 상단 작은 라벨 */}
        <line x1="5" y1="8" x2="19" y2="8" />
    </svg>
);

export default SynthIcon;
