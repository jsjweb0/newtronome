import { describe, expect, it, vi } from 'vitest';
import worker from './frontend.js';

describe('frontend Worker', () => {
  it('serves requests from static assets', async () => {
    const request = new Request('https://newtronome.example/board/free');
    const response = new Response('asset');
    const env = { ASSETS: { fetch: vi.fn().mockResolvedValue(response) } };

    expect(await worker.fetch(request, env)).toBe(response);
    expect(env.ASSETS.fetch).toHaveBeenCalledWith(request);
  });
});
