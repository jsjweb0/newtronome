import { useQuery } from "@tanstack/react-query";
import { searchITunesTracks } from "../services/searchITunesTracks";

const SEARCH_STALE_TIME = 5 * 60 * 1000;

export function useITunesSearch(searchKeyword: string | null) {
    return useQuery({
        queryKey: ['itunes', 'search', searchKeyword],
        queryFn: ({ signal }) => {
            if (searchKeyword === null) {
                return Promise.resolve([]);
            }

            return searchITunesTracks(searchKeyword, signal);
        },
        enabled: searchKeyword !== null,
        staleTime: SEARCH_STALE_TIME
    });
}