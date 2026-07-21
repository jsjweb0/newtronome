# Newtronome

Demo: https://newtronome.jsjweb0.workers.dev/

Newtronome은 React 학습 과정에서 시작해 음악 재생, 사용자 인증, 커뮤니티 기능까지 확장한 개인 프로젝트입니다. SoundCloud Widget 기반 개인 플레이리스트 랜덤 추천을 제공하고, 로그인 후 좋아요, 프로필 수정, 내가 쓴 글과 댓글 모아보기 등 사용자 활동 흐름을 구현했습니다.

음악 재생과 트랙 정보는 공식 SoundCloud Widget을 통해 동기화하며 별도의 SoundCloud Client ID를 사용하지 않습니다. 초기 React 학습 프로젝트라 라우팅, 인증, 게시판, 전역 상태 관리 등 여러 기능을 함께 실험한 흔적이 있으며, 이후 기능 단위 리팩토링을 계획하고 있습니다.

## Tech Stack

- React
- Vite
- Tailwind CSS
- Firebase Authentication / Firestore
- Cloudflare Workers Static Assets

## Main Features

- 공식 SoundCloud Widget 기반 플레이리스트 재생
- 개인 SoundCloud 플레이리스트 기반 랜덤 트랙 추천
- 현재 곡, 전체 트랙 목록, 재생 상태 동기화
- Firebase Authentication 기반 회원가입, 로그인, 로그아웃
- 로그인 사용자 기준 좋아요 기능
- 프로필 정보 수정
- 게시글 작성, 수정, 상세 보기
- 내가 쓴 글과 댓글을 모아보는 마이페이지
- 모바일과 데스크톱을 고려한 반응형 UI

## Folder Structure

```txt
src/
  components/     Reusable UI, player, track, board, auth components
  contexts/       Auth, audio player, toast, notification providers
  hooks/          Shared UI state hooks
  layouts/        Shared page layout
  pages/          Route-level pages
  utils/          Formatting and data helper functions
workers/
  frontend.js     Cloudflare frontend Worker entry
public/
  _redirects      SPA fallback for static hosting
```

## Installation

```bash
npm install
npm run dev
```

## Frontend Deployment

Cloudflare 로그인 후 빌드 결과를 Workers Static Assets로 배포합니다.
루트의 `wrangler.toml`은 로컬 배포와 Cloudflare Git 빌드가 함께 사용하는 프론트엔드 설정입니다.

```bash
npx wrangler login
npm run build
npm run frontend:deploy
```

## Build Commands

```bash
npm run lint
npm run build
```

## SoundCloud Widget Track Loading

PlaylistPanel은 기존 UI를 유지하면서 공식 SoundCloud Widget으로 재생을 제어합니다. Widget iframe은 화면에서 보이지 않게 배치하되 항상 마운트하며, `display: none`이나 조건부 렌더링으로 `READY` 이벤트가 막히지 않도록 했습니다.

SoundCloud Widget은 iframe에 실제로 렌더링된 범위만큼 플레이리스트 트랙을 지연 로딩할 수 있습니다. 현재 사용하는 플레이리스트는 최대 35곡이며, iframe 높이를 `3000px`로 설정해 전체 목록이 미리 렌더링되도록 했습니다. 바깥 컨테이너는 `size-px`와 `overflow-hidden`을 사용하므로 페이지 레이아웃에는 영향을 주지 않습니다.

이 방식은 SoundCloud가 공식적으로 보장하는 전체 트랙 조회 API가 아니라 Widget 내부 렌더링 동작을 이용합니다. 플레이리스트 곡 수가 늘거나 Widget 구현이 변경되면 전체 트랙이 로딩되는지 다시 확인해야 합니다.

## 배운 점

- 공식 SoundCloud Widget의 이벤트와 트랙 데이터를 React 전역 상태에 연결해 재생 UI를 동기화하는 방법을 배웠습니다.
- 별도의 Client ID나 비공식 API 요청 없이 Widget이 제공하는 범위 안에서 재생과 트랙 정보를 구성했습니다.
- 숨겨진 Widget도 `READY` 상태에 도달하려면 항상 마운트되어 있어야 하며, 렌더링 높이가 플레이리스트 트랙의 지연 로딩에 영향을 줄 수 있다는 점을 확인했습니다.
- 외부 음악 API를 사용할 때 로딩, 빈 목록, 재생 불가능한 트랙 상태를 세심하게 처리해야 한다는 점을 배웠습니다.
- 인증, 프로필, 게시판, 마이페이지 흐름을 구현하며 라우트 중심의 React 앱 구조와 사용자별 상태 관리 방식을 익혔습니다.

## Future Improvements

- Add a custom domain for the Cloudflare frontend deployment.
- Refactor the learning-project structure into clearer feature-based modules.
- Improve loading, empty, and error states across music, board, and mypage views.
- Add end-to-end checks for playlist loading and playback flows.
