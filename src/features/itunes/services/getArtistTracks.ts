import type { ITunesTrack } from "../types/itunes.types";
import { isITunesSearchResponse, isITunesTrack } from "../utils/itunesResponse";

interface GetArtistTracksParams {
    artistId: number;
    signal?: AbortSignal;
}

export async function getArtistTracks({
    artistId,
    signal,
}: GetArtistTracksParams): Promise<ITunesTrack[]> {
    if (!Number.isSafeInteger(artistId) || artistId <= 0) {
        throw new Error('아티스트 ID가 올바르지 않습니다.');
    }

    const params = new URLSearchParams({
        id: String(artistId),
        entity: 'song',
        limit: '5',
        sort: 'recent',
        country: 'US',
    });

    const response = await fetch(
        `https://itunes.apple.com/lookup?${params.toString()}`,
        { signal }
    );

    if (!response.ok) {
        throw new Error(
            '아티스트 곡 조회 요청에 실패했습니다.'
        );
    }

    const data: unknown = await response.json();

    if (!isITunesSearchResponse(data)) {
        throw new Error(
            '아티스트 곡 응답 형식이 올바르지 않습니다.'
        );
    }

    return data.results.filter(isITunesTrack).slice(0, 5);
}