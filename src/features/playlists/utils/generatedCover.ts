/**
 * 커버 없는 플레이리스트용 생성 커버 (시안 PlaylistCovers).
 * 플레이리스트 id를 FNV-1a 32bit로 해시해서 색 9종 · 도형 9종 중 하나를 고르므로
 * 같은 플레이리스트는 항상 같은 커버가 나온다.
 */

export interface CoverPalette {
  /** 배경 */
  c1: string;
  /** 도형 */
  c2: string;
  /** 아래 띠 */
  c3: string;
  /** 글씨 */
  lc: string;
}

export interface CoverShape {
  borderRadius: string;
  rotate: string;
  /** 아래 띠 높이 */
  bandHeight: string;
  left: string;
  top: string;
}

export const COVER_PALETTES: ReadonlyArray<CoverPalette> = [
  { c1: '#5B8FD6', c2: '#F2552C', c3: '#F6B73C', lc: '#FFFFFF' },
  { c1: '#F3E3D0', c2: '#F07A2B', c3: '#E2405A', lc: '#B23A2E' },
  { c1: '#25B5D8', c2: '#F5D23A', c3: '#E86AA6', lc: '#0B2A33' },
  { c1: '#F7A3B5', c2: '#FF9F5A', c3: '#F5C9D2', lc: '#7A2338' },
  { c1: '#D9C3A0', c2: '#6B7C8F', c3: '#B99A72', lc: '#2B2418' },
  { c1: '#7B6CF0', c2: '#FF6FA8', c3: '#3FC1E8', lc: '#FFFFFF' },
  { c1: '#2A1033', c2: '#F2385A', c3: '#3B5BD9', lc: '#F2D0DA' },
  { c1: '#9ED9E3', c2: '#F2F2F2', c3: '#6FB7C4', lc: '#14434B' },
  { c1: '#F04E8C', c2: '#FFB54A', c3: '#1FA7A0', lc: '#FFFFFF' },
];

export const COVER_SHAPES: ReadonlyArray<CoverShape> = [
  { borderRadius: '50%', rotate: '0deg', bandHeight: '26%', left: '12%', top: '18%' },
  { borderRadius: '50% 50% 0 0', rotate: '0deg', bandHeight: '30%', left: '27%', top: '34%' },
  { borderRadius: '12%', rotate: '12deg', bandHeight: '22%', left: '40%', top: '22%' },
  { borderRadius: '50%', rotate: '0deg', bandHeight: '18%', left: '30%', top: '16%' },
  { borderRadius: '0', rotate: '45deg', bandHeight: '34%', left: '48%', top: '26%' },
  { borderRadius: '50% 0', rotate: '-20deg', bandHeight: '24%', left: '20%', top: '30%' },
  { borderRadius: '0', rotate: '45deg', bandHeight: '20%', left: '27%', top: '20%' },
  { borderRadius: '4%', rotate: '0deg', bandHeight: '40%', left: '36%', top: '24%' },
  { borderRadius: '50%', rotate: '0deg', bandHeight: '38%', left: '44%', top: '14%' },
];

/** FNV-1a 32bit (UTF-8 바이트 기준) */
export function hashPlaylistId(id: string): number {
  let hash = 0x811c9dc5;

  for (const byte of new TextEncoder().encode(id)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash >>> 0;
}

export function getGeneratedCover(id: string) {
  const hash = hashPlaylistId(id);
  const paletteIndex = (hash >>> 16) % COVER_PALETTES.length;
  const shapeIndex = (hash >>> 4) % COVER_SHAPES.length;

  return {
    paletteIndex,
    shapeIndex,
    palette: COVER_PALETTES[paletteIndex],
    shape: COVER_SHAPES[shapeIndex],
  };
}
