export const isNonNegativeFiniteNumber = (
    value: unknown
): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0;

export const isNonNegativeInteger = (
    value: unknown
): value is number =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0;
