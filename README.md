# Newtronome

Demo: https://newtronome.jsjweb0.workers.dev/

Newtronome은 React 학습 과정에서 시작해 음악 재생, 사용자 인증, 커뮤니티 기능까지 확장한 개인 프로젝트입니다. SoundCloud Widget 기반 개인 플레이리스트 랜덤 추천을 제공하고, 로그인 후 좋아요, 프로필 수정, 내가 쓴 글과 댓글 모아보기 등 사용자 활동 흐름을 구현했습니다.

음악 재생과 트랙 정보는 공식 SoundCloud Widget을 통해 동기화하며 별도의 SoundCloud Client ID를 사용하지 않습니다. 초기 React 학습 프로젝트라 라우팅, 인증, 게시판, 전역 상태 관리 등 여러 기능을 함께 실험한 흔적이 있으며, 이후 기능 단위 리팩토링을 계획하고 있습니다.

## Tech Stack

- React
- TypeScript
- Vite
- Zustand
- Tailwind CSS
- Firebase Authentication / Firestore
- SoundCloud Widget API
- Cloudflare Workers Static Assets

## Main Features

- 공식 SoundCloud Widget 기반 플레이리스트 재생
- 개인 SoundCloud 플레이리스트 기반 랜덤 트랙 추천
- 현재 곡, 전체 트랙 목록, 재생 상태 동기화
- Firebase Authentication 기반 회원가입, 로그인, 로그아웃
- 로그인 사용자별 트랙 저장 및 Likes 목록 관리
- 프로필 정보 수정
- 게시글 작성, 수정, 상세 보기
- 내가 쓴 글과 댓글을 모아보는 마이페이지
- 모바일과 데스크톱을 고려한 반응형 UI

## Folder Structure

```txt
src/
  assets/          이미지, 폰트, 전역 스타일
  components/      공통 UI, 레이아웃, 게시판, 트랙 컴포넌트
  contexts/        인증, 테마, 토스트, 알림 상태
  features/
    bookmarks/     저장 트랙 컴포넌트, 훅, 페이지, 서비스, 타입
    player/        SoundCloud 플레이어 컴포넌트, 훅, 스토어, 타입
  hooks/           공통 애플리케이션 훅
  layouts/         공통 페이지 레이아웃
  pages/           인증, 게시판, 사용자, 공통 라우트 페이지
  utils/           포맷팅 및 데이터 유틸리티
public/
  mock/            로컬 게시글 및 댓글 목업 데이터
workers/
  frontend.js      Cloudflare 프론트엔드 Worker 진입점
firestore.rules    Firestore 접근 제어 규칙
wrangler.toml      Cloudflare 프론트엔드 배포 설정
```

## Installation

```bash
npm install
npm run dev
```

## Frontend Deployment

프론트엔드는 루트의 `wrangler.toml`을 사용해 Cloudflare Workers Static Assets로 배포합니다.

로컬에서 수동으로 배포하려면 Cloudflare 로그인 후 다음 명령을 실행합니다.

```bash
npx wrangler login
npm run build
npm run frontend:deploy
```

`main` 브랜치에 변경 사항이 반영되면 GitHub Actions가 동일한 `wrangler.toml`로 빌드와 배포를 자동 실행합니다. 자동 배포에는 GitHub 저장소의 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` secret이 필요합니다.

## Build Commands

```bash
npm run typecheck
npm run lint
npm run build
```

## 문제 해결: 불안정한 SoundCloud API 연동을 공식 Widget으로 전환

### 문제

개발 당시 SoundCloud 공식 API 접근이 제한되어 브라우저 요청에서 확인한 Client ID와 API 요청 구조를 Cloudflare Worker에 적용했습니다. Worker가 플레이리스트 정보를 조회하고 각 트랙의 재생 URL을 변환해 프론트엔드에 전달하는 방식이었습니다.

이 구조는 SoundCloud 측 Client ID나 요청 규격이 변경되면 재생이 중단되어 값을 다시 확인하고 Worker secret을 갱신해야 했습니다. 또한 플레이리스트 조회 후 각 트랙의 재생 URL을 추가로 요청해야 해, 캐시가 없는 초기 접속에서는 재생 목록을 표시하기까지 여러 네트워크 요청이 발생했습니다.

### 해결

유지보수가 어려운 비공식 API 요청과 별도 재생 로직을 제거하고, SoundCloud가 공식 제공하는 Widget API를 재생의 기준으로 변경했습니다. Widget의 `READY`, `PLAY`, `PAUSE`, `PLAY_PROGRESS` 이벤트를 React 상태와 연결하고 `getSounds`, `getCurrentSound`로 플레이리스트와 현재 트랙 정보를 동기화했습니다.

그 결과 별도의 Client ID 관리, Worker API 프록시, 트랙별 스트림 URL 변환이 필요하지 않게 되었고 SoundCloud가 제공하는 재생 흐름 안에서 플레이어를 유지할 수 있게 되었습니다.

### 상태 관리 구조 개선

기존에는 재생 상태와 제어 로직을 `AudioPlayerContext`에 모아 관리했습니다. 그러나 플레이어 바와 플레이리스트 패널처럼 레이아웃상 떨어진 UI가 현재 트랙, 재생 여부, 재생 시간, 플레이리스트를 함께 사용하고 있어 플레이어 구조가 커질수록 하나의 Context가 담당하는 범위도 넓어졌습니다.

플레이어 구조를 정리하는 과정에서 Widget 인스턴스와 이벤트 연결은 `useSoundCloudWidget` 훅이 담당하고, 여러 UI가 공유해야 하는 재생 상태는 Zustand store로 분리했습니다. 각 컴포넌트는 selector를 통해 필요한 상태만 구독하도록 구성했습니다.

Context로도 Provider와 상태를 세분화해 구현할 수 있지만, 이 프로젝트에서는 서비스의 핵심 기능인 플레이어 상태를 서로 떨어진 UI에서 반복해서 사용하므로 별도 store가 더 단순하다고 판단했습니다. 라이브러리 교체 자체보다 실제 재생을 담당하는 Widget, 외부 이벤트를 연결하는 훅, 화면 간 공유 상태를 보관하는 store의 책임을 구분하는 데 목적을 두었습니다.

### 트레이드오프

Widget 전환으로 API 기반 트랙 검색 기능은 제거했으며, 플레이리스트 데이터도 Widget이 제공하는 범위 안에서만 사용할 수 있습니다. 따라서 비공식 API의 기능 범위를 유지하기보다 재생 안정성과 유지보수성을 우선했습니다. Widget 내부 구현이나 로딩 방식이 변경될 가능성은 남아 있어 플레이리스트 로딩 상태를 계속 확인해야 합니다.

## SoundCloud Widget Track Loading

PlaylistPanel은 기존 UI를 유지하면서 공식 SoundCloud Widget으로 재생을 제어합니다. Widget iframe은 화면에서 보이지 않게 배치하되 항상 마운트하며, `display: none`이나 조건부 렌더링으로 `READY` 이벤트가 막히지 않도록 했습니다.

SoundCloud Widget은 iframe에 실제로 렌더링된 범위만큼 플레이리스트 트랙을 지연 로딩할 수 있습니다. 현재 사용하는 플레이리스트는 최대 35곡이며, iframe 높이를 `3000px`로 설정해 전체 목록이 미리 렌더링되도록 했습니다. Widget 컨테이너는 화면 밖에 절대 위치로 배치하고 overflow-hidden과 포인터 이벤트 차단을 적용해 화면 레이아웃과 사용자 조작에 영향을 주지 않도록 했습니다.

이 방식은 SoundCloud가 공식적으로 보장하는 전체 트랙 조회 API가 아니라 Widget 내부 렌더링 동작을 이용합니다. 플레이리스트 곡 수가 늘거나 Widget 구현이 변경되면 전체 트랙이 로딩되는지 다시 확인해야 합니다.

## 배운 점

- 공식 SoundCloud Widget의 이벤트와 트랙 데이터를 React 전역 상태에 연결해 재생 UI를 동기화하는 방법을 배웠습니다.
- 비공식 외부 API의 넓은 기능 범위보다 공식 연동 방식의 안정성과 유지보수성을 우선하는 판단이 필요하다는 점을 배웠습니다.
- 별도의 Client ID나 비공식 API 요청 없이 Widget이 제공하는 범위 안에서 재생과 트랙 정보를 구성했습니다.
- Widget 이벤트 연결과 화면 간 공유 상태를 분리하고, 여러 UI가 필요한 플레이어 상태만 선택해 구독하도록 구성했습니다.
- 숨겨진 Widget도 `READY` 상태에 도달하려면 항상 마운트되어 있어야 하며, 렌더링 높이가 플레이리스트 트랙의 지연 로딩에 영향을 줄 수 있다는 점을 확인했습니다.
- 외부 트랙 데이터가 항상 유효하다고 가정하지 않고, 필요한 필드를 검증한 뒤 애플리케이션 상태로 변환해야 한다는 점을 배웠습니다.
- 인증, 프로필, 게시판, 마이페이지 흐름을 구현하며 라우트 중심의 React 앱 구조와 사용자별 상태 관리 방식을 익혔습니다.

## 향후 개선 사항

- Cloudflare 프론트엔드 배포에 커스텀 도메인 연결
- 학습 프로젝트 구조를 더 명확한 기능 단위 모듈로 점진적으로 개선
- 음악, 게시판, 마이페이지의 로딩·빈 상태·오류 상태 보완
- 플레이리스트 로딩과 재생 흐름에 대한 E2E 테스트 추가
- Likes 페이지에서 저장한 트랙을 단일 재생 모드로 실행하고, 재생 중에는 기존 플레이리스트 패널을 비활성화한 뒤 트랙 종료 시 정지하도록 플레이어 모드 분리
