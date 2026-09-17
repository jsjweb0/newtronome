import type { ITunesSearchResponse, ITunesTrack } from "../types/itunes.types";

export async function searchITunesTracks(
    keyword: string,
    signal?: AbortSignal
): Promise<ITunesTrack[]> {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
        return [];
    }

    const params = new URLSearchParams({
        term: keyword.trim(),
        country: 'US',
        media: 'music',
        entity: 'song',
        limit: '20',
        lang: 'ko_kr',
    });

    const response = await fetch(
        `https://itunes.apple.com/search?${params.toString()}`,
        { signal }
    );

    if (!response.ok) {
        throw new Error('음악 검색 요청에 실패했습니다.');
    }

    const data = (await response.json()) as ITunesSearchResponse;

    return data.results;

}