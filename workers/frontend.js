const ITUNES_CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://jsjweb0.github.io',
};

export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);

    if (requestUrl.pathname !== '/api/itunes/search') {
      return env.ASSETS.fetch(request);
    }

    if (request.method !== 'GET') {
      return new Response(null, {
        status: 405,
        headers: {
          ...ITUNES_CORS_HEADERS,
          Allow: 'GET',
        },
      });
    }

    const term = requestUrl.searchParams.get('term')?.trim();

    if (!term) {
      return Response.json(
        {
          resultCount: 0,
          results: [],
        },
        {
          headers: ITUNES_CORS_HEADERS,
        }
      );
    }

    const searchParams = new URLSearchParams({
      term,
      country: 'US',
      media: 'music',
      entity: 'song',
      limit: '100',
    });

    const response = await fetch(`https://itunes.apple.com/us/search?${searchParams.toString()}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'NEWTRONOME/1.0',
      },
    });

    if (!response.ok) {
      return Response.json(
        {
          message: 'iTunes 검색 요청에 실패했습니다.',
          upstreamStatus: response.status,
          upstreamLocation: response.headers.get('Location'),
        },
        {
          status: 502,
          headers: ITUNES_CORS_HEADERS,
        }
      );
    }

    return new Response(response.body, {
      headers: {
        ...ITUNES_CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  },
};
