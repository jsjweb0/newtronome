export interface ITunesTrack {
    trackId: number;
    trackName: string;
    artistName: string;
    collectionName?: string;
    artworkUrl100?: string;
    previewUrl?: string;
    trackViewUrl?: string;
    trackTimeMillis?: number;
}

export interface ITunesSearchResponse {
    resultCount: number;
    results: unknown[];
}