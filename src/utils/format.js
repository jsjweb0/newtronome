import dayjs from "dayjs";

/**
 * 밀리초(ms) 단위의 시간을 "M:SS" 문자열로 변환합니다.
 * @param {number} ms - 밀리초 단위 시간
 * @returns {string} "분:초" 형식의 문자열 (예: 125000 → "2:05")
 */
export function formatTime(ms) {
    if (isNaN(ms) || ms < 0) return "--:--";
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * 큰 수를 읽기 편하게 k(천), m(만) 단위로 축약합니다.
 * @param {number} num - 변환할 숫자
 * @returns {string} 축약된 문자열 (예: 1500 → "1.5k", 25000 → "2.5m")
 */
export function formatCount(num) {
    if (num >= 10000) {
        // 만 단위 이상: 만 단위로 표시 + 'm'
        const n = (num / 10000).toFixed(1).replace(/\.0$/, "");
        return `${n}m`;
    }
    if (num >= 1000) {
        // 천 단위 이상: 천 단위로 표시 + 'k'
        const n = (num / 1000).toFixed(1).replace(/\.0$/, "");
        return `${n}k`;
    }
    return String(num);
}

export function formatDate(timestamp, withTime = false) {
    if (!timestamp) return "";
    let date = timestamp;
    if (typeof timestamp.toDate === "function") {
        date = timestamp.toDate();
    }

    return dayjs(date).format(
        withTime ? "YYYY-MM-DD HH:mm" : "YYYY-MM-DD"
    );
}