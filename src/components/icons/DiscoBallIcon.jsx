const DiscoBallIcon = ({ className = "w-5 h-5" }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* 외곽 원 */}
        <circle cx="12" cy="12" r="8" />
        {/* 가로선 */}
        <line x1="4" y1="12" x2="20" y2="12" />
        {/* 세로선 */}
        <line x1="12" y1="4" x2="12" y2="20" />
        {/* 대각선 */}
        <line x1="8" y1="8" x2="16" y2="16" />
        <line x1="8" y1="16" x2="16" y2="8" />
        {/* 상단 고리 */}
        <line x1="12" y1="2" x2="12" y2="4" />
    </svg>
);

export default DiscoBallIcon;