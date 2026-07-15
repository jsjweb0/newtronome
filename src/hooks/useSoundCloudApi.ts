import { useCallback, useState } from 'react';
import type { SoundCloudStreamRequest, Track } from '../types/track';
import {
  getSoundCloudStreamRequest,
  getSoundCloudTrackList,
  mapSoundCloudTrack,
} from '../utils/soundCloudTrackMapper';

const CLOUDFLARE_API_BASE = 'https://newtronome-soundcloud-api.jsjweb0.workers.dev/api';
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : CLOUDFLARE_API_BASE);
const CACHE_PREFIX = 'newtronome:soundcloud:v2:';
const CACHE_TTL = 1000 * 60 * 30;
const SEARCH_LIMIT = 20;
const PLAYLIST_TRACK_LIMIT = 12;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toError = (value: unknown) =>
  value instanceof Error ? value : new Error('Unknown SoundCloud API error');

const getCachedJson = (key: string): unknown | null => {
  if (typeof window === 'undefined') return null;

  try {
    const cached = window.localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const parsed: unknown = JSON.parse(cached);
    if (!isRecord(parsed) || typeof parsed.expiresAt !== 'number') return null;

    if (Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return parsed.data ?? null;
  } catch {
    return null;
  }
};

const setCachedJson = (key: string, data: unknown) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({
        data,
        expiresAt: Date.now() + CACHE_TTL,
      })
    );
  } catch {
    // Storage can be unavailable in private mode or full storage.
  }
};

const getTrackLabel = (value: unknown) => {
  if (!isRecord(value)) return 'unknown';
  if (typeof value.title === 'string' && value.title) return value.title;
  if (typeof value.id === 'number' || typeof value.id === 'string') return String(value.id);
  return 'unknown';
};

const isTrack = (track: Track | null): track is Track => track !== null;

export default function useSoundCloudApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resolveUrl = useCallback(async (url: string): Promise<unknown> => {
    const cacheKey = `resolve:${url}`;
    const cached = getCachedJson(cacheKey);
    if (cached !== null) return cached;

    const response = await fetch(`${API_BASE}/resolve?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data: unknown = await response.json();
    setCachedJson(cacheKey, data);
    return data;
  }, []);

  const getStreamUrl = useCallback(
    async ({ path, trackAuthorization = '' }: SoundCloudStreamRequest): Promise<string> => {
      const params = new URLSearchParams({ path });
      if (trackAuthorization) params.set('track_authorization', trackAuthorization);

      const response = await fetch(`${API_BASE}/stream?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: unknown = await response.json();
      if (!isRecord(data) || typeof data.url !== 'string' || !data.url) {
        throw new Error('Invalid stream response');
      }
      return data.url;
    },
    []
  );

  const hydrateTrack = useCallback(
    async (rawTrack: unknown): Promise<Track | null> => {
      try {
        const streamRequest = getSoundCloudStreamRequest(rawTrack);
        if (!streamRequest) return null;

        const audioUrl = await getStreamUrl(streamRequest);
        return mapSoundCloudTrack(rawTrack, audioUrl);
      } catch (caughtError) {
        console.warn(`Skipping unavailable track: ${getTrackLabel(rawTrack)}`, caughtError);
        return null;
      }
    },
    [getStreamUrl]
  );

  const getPlaylistByUrl = useCallback(
    async (playlistUrl: string): Promise<Track[]> => {
      setLoading(true);
      setError(null);
      try {
        const playlist = await resolveUrl(playlistUrl);
        const tracks = getSoundCloudTrackList(playlist, 'tracks').slice(0, PLAYLIST_TRACK_LIMIT);
        const mapped = await Promise.all(tracks.map(hydrateTrack));
        return mapped.filter(isTrack);
      } catch (caughtError) {
        console.error(`getPlaylistByUrl failed: ${playlistUrl}`, caughtError);
        setError(toError(caughtError));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [hydrateTrack, resolveUrl]
  );

  const getPlaylistsByUrls = useCallback(
    async (urls: string[]): Promise<Track[]> => {
      setLoading(true);
      setError(null);
      try {
        const lists = await Promise.all(urls.map((url) => getPlaylistByUrl(url)));
        return lists.flat();
      } catch (caughtError) {
        console.error('getPlaylistsByUrls failed', caughtError);
        setError(toError(caughtError));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [getPlaylistByUrl]
  );

  const searchTracks = useCallback(async (query: string): Promise<unknown[]> => {
    setLoading(true);
    setError(null);
    try {
      const cacheKey = `search:${query}`;
      const cached = getCachedJson(cacheKey);
      if (Array.isArray(cached)) return cached.slice(0, SEARCH_LIMIT);

      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data: unknown = await response.json();
      const collection = getSoundCloudTrackList(data, 'collection').slice(0, SEARCH_LIMIT);
      setCachedJson(cacheKey, collection);
      return collection;
    } catch (caughtError) {
      console.error(`searchTracks failed: ${query}`, caughtError);
      setError(toError(caughtError));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchTracksWithDetails = useCallback(
    async (query: string): Promise<Track[]> => {
      setLoading(true);
      setError(null);
      try {
        const rawTracks = await searchTracks(query);
        const mapped = await Promise.all(rawTracks.map(hydrateTrack));
        return mapped.filter(isTrack);
      } catch (caughtError) {
        console.error(`searchTracksWithDetails failed: ${query}`, caughtError);
        setError(toError(caughtError));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [hydrateTrack, searchTracks]
  );

  const getTrackById = useCallback(async (id: string | number): Promise<unknown> => {
    const response = await fetch(`${API_BASE}/resolve?url=${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error('SC track fetch failed');
    return response.json();
  }, []);

  return {
    loading,
    error,
    getPlaylistByUrl,
    getPlaylistsByUrls,
    searchTracks,
    searchTracksWithDetails,
    getStreamUrl,
    getTrackById,
  };
}
