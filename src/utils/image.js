// 고해상도 artwork URL로 변환
export function toHighResArtwork(url, size = 't500x500') {
  if (!url) {
    return '../../assets/logo_n.png'; // 적당한 기본 이미지 경로로 바꿔주세요
  }

  return url.replace(
    /-(?:large|t\d+x\d+)(\.[a-z0-9]+)([?#].*)?$/i,
    `-${size}$1$2`
  );
}

// 기본 이미지 주소 반환 (artwork 없을 때 대비) `/images/placeholder-${idx % 5}.png`;
export const fallbackArtwork = () => '../assets/no-image.webp';

// artwork가 없으면 fallback 포함 처리
export const getArtworkOrFallback = (url, idx = 0) =>
  url ? toHighResArtwork(url) : fallbackArtwork(idx);
