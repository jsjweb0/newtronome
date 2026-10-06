import { useQuery } from "@tanstack/react-query";
import { getArtistTracks } from "../services/getArtistTracks";

const ARTIST_TRACKS_STALE_TIME = 5 * 60 * 1000;

export function useArtistTracks(
    artistId: number | null
) {
    return useQuery({
        queryKey: [
            'itunes',
            'artist-tracks',
            artistId,
        ],
        queryFn: ({ signal }) => {
            if (artistId === null) {
                return Promise.resolve([]);
            }

            return getArtistTracks({
                artistId,
                signal,
            });
        },
        enabled: artistId !== null,
        staleTime: ARTIST_TRACKS_STALE_TIME,
    });
}