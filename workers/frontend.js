const PET_API_ORIGIN = 'https://apis.data.go.kr';
const PET_API_PATH = '/1543061/abandonmentPublicService_v2';
const ALLOWED_CROSS_ORIGINS = new Set(['https://jsjweb0.github.io']);

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin');
  if (!origin || !ALLOWED_CROSS_ORIGINS.has(origin)) return {};

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept',
    Vary: 'Origin',
  };
}

function jsonResponse(request, body, status) {
  return Response.json(body, {
    status,
    headers: {
      ...getCorsHeaders(request),
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function getPositiveInteger(value, fallback, maximum) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;

  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 1 && number <= maximum
    ? number
    : null;
}

function decodeServiceKey(serviceKey) {
  const trimmedKey = serviceKey.trim();

  try {
    return decodeURIComponent(trimmedKey);
  } catch {
    return trimmedKey;
  }
}

function createPetApiUrl(path, serviceKey, params) {
  const url = new URL(`${PET_API_PATH}/${path}`, PET_API_ORIGIN);
  url.searchParams.set('serviceKey', decodeServiceKey(serviceKey));
  url.searchParams.set('_type', 'json');

  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, String(value));
  }

  return url;
}

async function proxyPetApi(request, env, path, params) {
  if (!env.PET_API_SERVICE_KEY) {
    return jsonResponse(request, { error: '보호동물 API 설정이 필요합니다.' }, 500);
  }

  try {
    const upstreamResponse = await fetch(
      createPetApiUrl(path, env.PET_API_SERVICE_KEY, params),
      {
        signal: request.signal,
        headers: { Accept: 'application/json' },
      }
    );

    if (!upstreamResponse.ok) {
      console.error(JSON.stringify({
        event: 'pet_api_error',
        status: upstreamResponse.status,
      }));
      return jsonResponse(request, { error: '보호동물 API 요청에 실패했습니다.' }, 502);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        ...getCorsHeaders(request),
        'Content-Type': upstreamResponse.headers.get('Content-Type') ?? 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    console.error(JSON.stringify({
      event: 'pet_api_fetch_failed',
    }));
    return jsonResponse(request, { error: '보호동물 API 요청에 실패했습니다.' }, 502);
  }
}

async function handleApiRequest(request, env, url) {
  const isPetRoute = url.pathname === '/api/pets' || url.pathname === '/api/pet-regions';
  if (!isPetRoute) return null;

  if (request.method === 'OPTIONS') {
    const origin = request.headers.get('Origin');
    if (origin && !ALLOWED_CROSS_ORIGINS.has(origin)) {
      return jsonResponse(request, { error: '허용되지 않은 출처입니다.' }, 403);
    }
    return new Response(null, { status: 204, headers: getCorsHeaders(request) });
  }

  if (request.method !== 'GET') {
    return jsonResponse(request, { error: '지원하지 않는 요청 방식입니다.' }, 405);
  }

  if (url.pathname === '/api/pet-regions') {
    return proxyPetApi(request, env, 'sido_v2', { numOfRows: 100 });
  }

  const pageNo = getPositiveInteger(url.searchParams.get('pageNo'), 1, 1000);
  const numOfRows = getPositiveInteger(url.searchParams.get('numOfRows'), 30, 100);
  if (pageNo === null || numOfRows === null) {
    return jsonResponse(request, { error: '요청 범위가 올바르지 않습니다.' }, 400);
  }

  return proxyPetApi(request, env, 'abandonmentPublic_v2', { pageNo, numOfRows });
}

export default {
  async fetch(request, env) {
    const apiResponse = await handleApiRequest(request, env, new URL(request.url));
    return apiResponse ?? env.ASSETS.fetch(request);
  },
};
