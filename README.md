### Newtronome

Demo: https://newtronome.netlify.app/  
Cloudflare Worker API: replace with deployed Worker URL

SoundCloud API를 연동해 트랙 검색, 랜덤 재생, 플레이리스트 재생, 로그인 후 좋아요 기능을 제공하는 React 음악 플레이어입니다. 프론트엔드는 Vite로 빌드하고, SoundCloud Client ID는 Cloudflare Worker에 secret으로 보관해 브라우저 번들에 노출되지 않도록 분리했습니다.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Firebase Authentication / Firestore
- Cloudflare Workers

## Main Features

- SoundCloud 트랙 검색과 스트리밍 URL 변환
- 플레이리스트 기반 트랙 로딩
- 오디오 플레이어, 재생목록, 좋아요 상태 관리
- Firebase 로그인 기반 사용자 기능
- 모바일과 데스크톱을 고려한 반응형 레이아웃
- Cloudflare Worker API 프록시로 비밀키 보호

## Folder Structure

```txt
src/
  components/     Reusable UI, player, board, auth components
  contexts/       Auth, audio player, toast, notification providers
  hooks/          SoundCloud API and UI state hooks
  layouts/        Shared page layout
  pages/          Route-level pages
  utils/          Formatting and data helper functions
workers/
  soundcloud-api.js  Cloudflare Worker for SoundCloud API proxying
public/
  _redirects      SPA fallback for static hosting
```

## Installation

```bash
npm install
npm run dev
```

## Cloudflare Worker Setup

1. Log in to Cloudflare Workers.

```bash
npx wrangler login
```

2. Store the SoundCloud Client ID as a Worker secret.

```bash
npx wrangler secret put SOUND_CLOUD_CLIENT_ID
```

3. Run the Worker locally.

```bash
npm run worker:dev
```

4. In a local `.env` file, point the React app to the Worker.

```bash
VITE_API_BASE_URL=http://localhost:8787/api
```

5. Deploy the Worker.

```bash
npm run worker:deploy
```

6. In the frontend hosting dashboard, set the production API URL.

```bash
VITE_API_BASE_URL=https://newtronome-soundcloud-api.<your-subdomain>.workers.dev/api
```

## Build Commands

```bash
npm run lint
npm run build
```

## What I Learned

- API keys used by React must not be stored in `VITE_` variables when they need to remain private.
- A small Worker can keep the frontend static while protecting external API credentials.
- Keeping the existing `/api/search`, `/api/resolve`, and `/api/stream` shape made the migration smaller and easier to verify.

## Future Improvements

- Move the frontend deployment from Netlify to Cloudflare Pages.
- Add loading and empty states to every board/search view consistently.
- Add end-to-end checks for the player search and playback flow.
