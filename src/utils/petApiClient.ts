const configuredApiBaseUrl = import.meta.env.VITE_PET_API_BASE_URL?.trim();
const apiBaseUrl = configuredApiBaseUrl?.replace(/\/$/, '') ?? '';

async function fetchPetApi(
  path: string,
  signal: AbortSignal,
  params?: URLSearchParams
): Promise<unknown> {
  const query = params?.toString();
  const response = await fetch(
    `${apiBaseUrl}${path}${query ? `?${query}` : ''}`,
    {
      signal,
      headers: { Accept: 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`보호동물 API 요청 실패: ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

export function fetchPetPosts(
  signal: AbortSignal,
  numOfRows: number
): Promise<unknown> {
  return fetchPetApi(
    '/api/pets',
    signal,
    new URLSearchParams({ pageNo: '1', numOfRows: String(numOfRows) })
  );
}

export function fetchPetRegions(signal: AbortSignal): Promise<unknown> {
  return fetchPetApi('/api/pet-regions', signal);
}
