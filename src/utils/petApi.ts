export interface PetPost {
  desertionNo: string;
  noticeSdt?: string;
  noticeEdt?: string;
  noticeNo?: string;
  popfile1?: string;
  popfile2?: string;
  kindNm?: string;
  colorCd?: string;
  careNm?: string;
  careTel?: string;
  careAddr?: string;
  processState?: string;
  upKindCd?: string;
  upKindNm?: string;
  orgNm?: string;
  sexCd?: string;
  neuterYn?: string;
  age?: string;
  weight?: string;
  rfidCd?: string;
  specialMark?: string;
  updTm?: string;
  happenPlace?: string;
  likeCount?: number;
}

export interface RegionOption {
  orgdownNm: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value.toString();
  return undefined;
}

function getItems(payload: unknown): unknown[] {
  if (!isRecord(payload)) return [];

  const response = payload.response;
  if (!isRecord(response)) return [];

  const body = response.body;
  if (!isRecord(body)) return [];

  const items = body.items;
  if (!isRecord(items)) return [];

  const item = items.item;
  if (Array.isArray(item)) return item;
  return item === undefined || item === null ? [] : [item];
}

function toPetPost(value: unknown): PetPost | null {
  if (!isRecord(value)) return null;

  const desertionNo = getString(value.desertionNo);
  if (!desertionNo) return null;

  return {
    desertionNo,
    noticeSdt: getString(value.noticeSdt),
    noticeEdt: getString(value.noticeEdt),
    noticeNo: getString(value.noticeNo),
    popfile1: getString(value.popfile1),
    popfile2: getString(value.popfile2),
    kindNm: getString(value.kindNm),
    colorCd: getString(value.colorCd),
    careNm: getString(value.careNm),
    careTel: getString(value.careTel),
    careAddr: getString(value.careAddr),
    processState: getString(value.processState),
    upKindCd: getString(value.upKindCd),
    upKindNm: getString(value.upKindNm),
    orgNm: getString(value.orgNm),
    sexCd: getString(value.sexCd),
    neuterYn: getString(value.neuterYn),
    age: getString(value.age),
    weight: getString(value.weight),
    rfidCd: getString(value.rfidCd),
    specialMark: getString(value.specialMark),
    updTm: getString(value.updTm),
    happenPlace: getString(value.happenPlace),
    likeCount:
      typeof value.likeCount === 'number' && Number.isFinite(value.likeCount)
        ? value.likeCount
        : undefined,
  };
}

export function parsePetPostsResponse(payload: unknown): PetPost[] {
  return getItems(payload).flatMap((item) => {
    const post = toPetPost(item);
    return post ? [post] : [];
  });
}

export function parseRegionOptionsResponse(payload: unknown): RegionOption[] {
  return getItems(payload).flatMap((item) => {
    if (!isRecord(item)) return [];

    const orgdownNm = getString(item.orgdownNm);
    return orgdownNm ? [{ orgdownNm }] : [];
  });
}
