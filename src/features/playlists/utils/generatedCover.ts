/**
 * 플레이리스트용 생성 커버 (시안 PlaylistCovers).
 * 카탈로그의 색은 ID마다 배정하고, 도형과 미등록 ID의 색은 해시로 고른다.
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
  { c1: '#F3E3D0', c2: '#F07A2B', c3: '#E2405A', lc: '#00192E' },
  { c1: '#25B5D8', c2: '#F5D23A', c3: '#E86AA6', lc: '#0B2A33' },
  { c1: '#F7A3B5', c2: '#FF9F5A', c3: '#F5C9D2', lc: '#7A2338' },
  { c1: '#D9C3A0', c2: '#6B7C8F', c3: '#B99A72', lc: '#2B2418' },
  { c1: '#7B6CF0', c2: '#FF6FA8', c3: '#268D5D', lc: '#FFFFFF' },
  { c1: '#2A1033', c2: '#F2385A', c3: '#3B5BD9', lc: '#F2D0DA' },
  { c1: '#9ED9E3', c2: '#F2F2F2', c3: '#6FB7C4', lc: '#14434B' },
  { c1: '#F04E8C', c2: '#FFB54A', c3: '#1FA7A0', lc: '#FFFFFF' },
  { c1: '#E96018', c2: '#F5D23A', c3: '#0C31C7', lc: '#DAF5FD' },
  { c1: '#C1EBE9', c2: '#F4AE52', c3: '#4F252E', lc: '#FFF7C5' },
  { c1: '#F16B6F', c2: '#C5C6B6', c3: '#AACD6E', lc: '#3C3530' },
  { c1: '#6f3826', c2: '#f15c5c', c3: '#b84a39', lc: '#d6ecfa' },
  { c1: '#15634F', c2: '#CDEB82', c3: '#16453C', lc: '#F4F8DF' },
  { c1: '#F6DF72', c2: '#FB714F', c3: '#F2BE4E', lc: '#2A2414' },
  { c1: '#202D52', c2: '#64C8EF', c3: '#37467B', lc: '#F0F6FF' },
];

const paletteIndexByPlaylistId = new Map<string, number>([
  ['2025-summer', 12],
  ['2024-spring', 10],
  ['2023-spring', 6],
  ['2022-summer', 9],
  ['2020-spring', 4],
  ['2019-spring', 1],
  ['2018-disco', 3],
  ['2017-summer', 13],
  ['2017-spring', 8],
  ['2017spring', 0],
  ['m3stc8ixvqcw', 14],
  ['lkuriahk4u4p', 5],
  ['1j886wtueuzr', 2],
  ['spring-disco', 11],
  ['autumn-disco', 7],
  ['summer-disco2', 15],
]);

export const COVER_SHAPES: ReadonlyArray<CoverShape> = [
  { borderRadius: '50%', rotate: '0deg', bandHeight: '24%', left: '14%', top: '22%' },
  { borderRadius: '50% 50% 6% 6%', rotate: '-18deg', bandHeight: '31%', left: '36%', top: '15%' },
  { borderRadius: '14%', rotate: '26deg', bandHeight: '19%', left: '23%', top: '28%' },
  { borderRadius: '50% 6%', rotate: '17deg', bandHeight: '28%', left: '43%', top: '21%' },
  { borderRadius: '0', rotate: '43deg', bandHeight: '36%', left: '15%', top: '25%' },
  { borderRadius: '8% 48% 42% 20%', rotate: '-31deg', bandHeight: '21%', left: '33%', top: '17%' },
  { borderRadius: '50% 4% 4% 50%', rotate: '32deg', bandHeight: '27%', left: '10%', top: '31%' },
  { borderRadius: '27% 8% 34% 12%', rotate: '-12deg', bandHeight: '17%', left: '45%', top: '28%' },
  { borderRadius: '50% 50% 50% 10%', rotate: '38deg', bandHeight: '33%', left: '28%', top: '14%' },
  { borderRadius: '20% 38% 12% 38%', rotate: '-24deg', bandHeight: '23%', left: '39%', top: '32%' },
  { borderRadius: '5% 5% 48% 48%', rotate: '13deg', bandHeight: '29%', left: '17%', top: '18%' },
  { borderRadius: '45% 16% 9% 28%', rotate: '-37deg', bandHeight: '25%', left: '29%', top: '25%' },
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
  const paletteIndex = paletteIndexByPlaylistId.get(id) ?? (hash >>> 16) % COVER_PALETTES.length;
  const shapeIndex = (hash >>> 4) % COVER_SHAPES.length;

  return {
    paletteIndex,
    shapeIndex,
    palette: COVER_PALETTES[paletteIndex],
    shape: COVER_SHAPES[shapeIndex],
  };
}
