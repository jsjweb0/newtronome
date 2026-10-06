import type { ITunesTrack } from "../types/itunes.types";
import { isITunesSearchResponse, isITunesTrack } from "../utils/itunesResponse";

export async function searchITunesTracks(
    keyword: string,
    signal?: AbortSignal
): Promise<ITunesTrack[]> {

    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) {
        return [];
    }

    const params = new URLSearchParams({
        term: trimmedKeyword,
        country: 'US',
        media: 'music',
        entity: 'song',
        limit: '100',
    });

    const response = await fetch(
        `https://itunes.apple.com/search?${params.toString()}`,
        { signal }
    );

    if (!response.ok) {
        throw new Error('음악 검색 요청에 실패했습니다.');
    }

    const data: unknown = await response.json();

    if (!isITunesSearchResponse(data)) {
        throw new Error('음악 검색 응답 형식이 올바르지 않습니다.');
    }

    const tracks = data.results.filter(isITunesTrack);

    if (data.results.length > 0 && tracks.length === 0) {
        throw new Error('음악 검색 응답 형식이 올바르지 않습니다.');
    }

    return tracks;
}
