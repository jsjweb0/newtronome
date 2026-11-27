type ArtworkUrl = string | null | undefined;

// 고해상도 artwork URL로 변환
export function toHighResArtwork(url: ArtworkUrl, size = 't500x500'): string {
  if (!url) {
    return '../../assets/logo_n.png'; // 적당한 기본 이미지 경로로 바꿔주세요
  }

  return url.replace(/-(?:large|t\d+x\d+)(\.[a-z0-9]+)([?#].*)?$/i, `-${size}$1$2`);
}
