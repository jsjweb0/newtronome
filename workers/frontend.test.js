import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from './frontend.js';

const apiPayload = { response: { header: { resultCode: '00' }, body: { items: '' } } };

function createEnv(overrides = {}) {
  return {
    PET_API_SERVICE_KEY: 'server-only-key',
    ASSETS: { fetch: vi.fn().mockResolvedValue(new Response('asset')) },
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('frontend Worker pet API proxy', () => {
  it('adds the server secret only to the upstream request', async () => {
    const upstreamFetch = vi.fn().mockResolvedValue(Response.json(apiPayload));
    vi.stubGlobal('fetch', upstreamFetch);

    const response = await worker.fetch(
      new Request('https://newtronome.example/api/pets?numOfRows=30'),
      createEnv()
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(apiPayload);
    const upstreamUrl = new URL(upstreamFetch.mock.calls[0][0]);
    expect(upstreamUrl.origin).toBe('https://apis.data.go.kr');
    expect(upstreamUrl.searchParams.get('serviceKey')).toBe('server-only-key');
    expect(upstreamUrl.searchParams.get('numOfRows')).toBe('30');
  });

  it('does not double-encode a portal encoding key', async () => {
    const upstreamFetch = vi.fn().mockResolvedValue(Response.json(apiPayload));
    vi.stubGlobal('fetch', upstreamFetch);

    await worker.fetch(
      new Request('https://newtronome.example/api/pets'),
      createEnv({ PET_API_SERVICE_KEY: 'encoded%2Bkey%2Fpart%3D%3D' })
    );

    const upstreamUrl = String(upstreamFetch.mock.calls[0][0]);
    expect(upstreamUrl).toContain('serviceKey=encoded%2Bkey%2Fpart%3D%3D');
    expect(upstreamUrl).not.toContain('%252B');
    expect(upstreamUrl).not.toContain('%252F');
  });

  it('rejects invalid ranges without calling the upstream API', async () => {
    const upstreamFetch = vi.fn();
    vi.stubGlobal('fetch', upstreamFetch);

    const response = await worker.fetch(
      new Request('https://newtronome.example/api/pets?numOfRows=101'),
      createEnv()
    );

    expect(response.status).toBe(400);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });

  it('allows the GitHub Pages origin and falls back to static assets', async () => {
    const upstreamFetch = vi.fn().mockResolvedValue(Response.json(apiPayload));
    vi.stubGlobal('fetch', upstreamFetch);
    const env = createEnv();

    const apiResponse = await worker.fetch(
      new Request('https://newtronome.example/api/pet-regions', {
        headers: { Origin: 'https://jsjweb0.github.io' },
      }),
      env
    );
    const assetResponse = await worker.fetch(
      new Request('https://newtronome.example/board/free'),
      env
    );

    expect(apiResponse.headers.get('Access-Control-Allow-Origin')).toBe('https://jsjweb0.github.io');
    expect(await assetResponse.text()).toBe('asset');
    expect(env.ASSETS.fetch).toHaveBeenCalledTimes(1);
  });

  it('reports a missing Worker secret without contacting the upstream API', async () => {
    const upstreamFetch = vi.fn();
    vi.stubGlobal('fetch', upstreamFetch);

    const response = await worker.fetch(
      new Request('https://newtronome.example/api/pets'),
      createEnv({ PET_API_SERVICE_KEY: '' })
    );

    expect(response.status).toBe(500);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });
});
