type ArtworkUrl = string | null | undefined;

// 고해상도 artwork URL로 변환
export function toHighResArtwork(url: ArtworkUrl, size = 't500x500'): string {
  if (!url) {
    return '../../assets/logo_n.png'; // 적당한 기본 이미지 경로로 바꿔주세요
  }

  return url.replace(/-(?:large|t\d+x\d+)(\.[a-z0-9]+)([?#].*)?$/i, `-${size}$1$2`);
}

// 기본 이미지 주소 반환 (artwork 없을 때 대비) `/images/placeholder-${idx % 5}.png`;
export const fallbackArtwork = (_idx = 0): string => '../assets/no-image.webp';

// artwork가 없으면 fallback 포함 처리
export const getArtworkOrFallback = (url: ArtworkUrl, idx = 0): string =>
  url ? toHighResArtwork(url) : fallbackArtwork(idx);
