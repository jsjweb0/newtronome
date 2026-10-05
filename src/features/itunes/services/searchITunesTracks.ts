import { isNonNegativeFiniteNumber, isNonNegativeInteger } from "../../../utils/numberValidation";
import type { ITunesSearchResponse, ITunesTrack } from "../types/itunes.types";

const isRecord = (
    value: unknown
): value is Record<string, unknown> => {
    return (
        typeof value === 'object' && value !== null && !Array.isArray(value)
    );
};

const isPositiveSafeInteger = (
    value: unknown
): value is number => {
    return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
};

const isOptionalNonNegativeFiniteNumber = (
    value: unknown
): value is number | undefined => {
    return value === undefined || isNonNegativeFiniteNumber(value);
};

const isOptionalString = (
    value: unknown
): value is string | undefined => {
    return value === undefined || typeof value === 'string';
};

const isITunesTrack = (
    value: unknown
): value is ITunesTrack => {
    if (!isRecord(value)) {
        return false;
    }

    return (
        isPositiveSafeInteger(value.trackId) &&
        typeof value.trackName === 'string' &&
        typeof value.artistName === 'string' &&
        isOptionalString(value.collectionName) &&
        isOptionalString(value.artworkUrl100) &&
        isOptionalString(value.previewUrl) &&
        isOptionalString(value.trackViewUrl) &&
        isOptionalNonNegativeFiniteNumber(value.trackTimeMillis)
    );
}

const isITunesSearchResponse = (
    value: unknown
): value is ITunesSearchResponse => {
    if (!isRecord(value)) {
        return false;
    }

    return (
        isNonNegativeInteger(value.resultCount) &&
        Array.isArray(value.results)
    );
};

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
