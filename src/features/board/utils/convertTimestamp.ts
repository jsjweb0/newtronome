import { Timestamp } from 'firebase/firestore';

export function convertTimestamp(value: unknown): Date | null {
    if (value instanceof Timestamp) {
        return value.toDate();
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
        const date = new Date(value);

        return Number.isNaN(date.getTime()) ? null : date;
    }

    return null;
}