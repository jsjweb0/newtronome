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

export const isITunesTrack = (
    value: unknown
): value is ITunesTrack => {
    if (!isRecord(value)) return false;

    return (
        isPositiveSafeInteger(value.artistId) &&
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

export const isITunesSearchResponse = (
    value: unknown
): value is ITunesSearchResponse => {
    if (!isRecord(value)) return false;

    return (
        isNonNegativeInteger(value.resultCount) &&
        Array.isArray(value.results)
    );
};