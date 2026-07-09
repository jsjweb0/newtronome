# Newtronome

Demo: https://newtronome.jsjweb0.workers.dev/  
Cloudflare Worker API: https://newtronome-soundcloud-api.jsjweb0.workers.dev/api

Newtronome은 React 학습 과정에서 시작해 음악 검색 및 재생, 사용자 인증, 커뮤니티 기능까지 확장한 개인 프로젝트입니다. SoundCloud API 기반 트랙 검색과 개인 플레이리스트 랜덤 추천을 제공하고, 로그인 후 좋아요, 프로필 수정, 내가 쓴 글과 댓글 모아보기 등 사용자 활동 흐름을 구현했습니다.

SoundCloud Client ID는 Cloudflare Worker secret으로 관리해 브라우저 번들에 노출되지 않도록 분리했습니다. 초기 React 학습 프로젝트라 라우팅, 인증, 게시판, 전역 상태 관리 등 여러 기능을 함께 실험한 흔적이 있으며, 이후 기능 단위 리팩토링을 계획하고 있습니다.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Firebase Authentication / Firestore
- Cloudflare Workers

## Main Features

- SoundCloud 트랙 검색과 재생 가능한 스트리밍 URL 변환
- 개인 SoundCloud 플레이리스트 기반 랜덤 트랙 추천
- 검색 결과 미리듣기와 전역 오디오 플레이어 연결
- 재생목록 추가, 정렬, 재생 상태 관리
- Firebase Authentication 기반 회원가입, 로그인, 로그아웃
- 로그인 사용자 기준 좋아요 기능
- 프로필 정보 수정
- 게시글 작성, 수정, 상세 보기
- 내가 쓴 글과 댓글을 모아보는 마이페이지
- Cloudflare Worker API 프록시를 통한 Client ID 보호
- 모바일과 데스크톱을 고려한 반응형 UI

## Folder Structure

```txt
src/
  components/     Reusable UI, player, track, board, auth components
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
VITE_API_BASE_URL=https://newtronome-soundcloud-api.jsjweb0.workers.dev/api
```

## Build Commands

```bash
npm run lint
npm run build
```

## What I Learned

- API keys used by React must not be stored in `VITE_` variables when they need to remain private.
- A small Worker can keep the frontend static while protecting external API credentials.
- Separating `/api/search`, `/api/resolve`, and `/api/stream` made the SoundCloud request flow easier to test and explain.
- Loading, empty, and unavailable-track states need to be handled carefully when relying on an external music API.
- Building auth, profile, board, and mypage flows helped me understand route-based React app structure and user-specific UI state.

## Future Improvements

- Add a custom domain for the Cloudflare frontend deployment.
- Refactor the learning-project structure into clearer feature-based modules.
- Improve loading, empty, and error states across music, board, and mypage views.
- Add end-to-end checks for the player search and playback flow.
