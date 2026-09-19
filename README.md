# Newtronome

- Demo: https://newtronome.jsjweb0.workers.dev/
- Repository: https://github.com/jsjweb0/newtronome

Newtronome은 React 학습 과정에서 시작해 음악 재생, 검색, 사용자 인증, 커뮤니티 기능으로 확장한 개인 프로젝트입니다. SoundCloud 개인 플레이리스트를 기반으로 랜덤 재생을 제공하고, iTunes Search API로 곡을 검색해 미리듣기를 재생할 수 있습니다. 로그인 사용자는 트랙 저장과 저장한 곡의 단일 재생, 프로필 수정, 게시글·댓글 작성과 활동 내역 조회 기능을 이용할 수 있습니다.

음악 재생과 트랙 정보는 공식 SoundCloud Widget 이벤트를 React와 Zustand 상태에 동기화하며, 별도의 SoundCloud Client ID나 비공식 API 프록시를 사용하지 않습니다. React 애플리케이션 코드를 TypeScript로 전환했으며, SoundCloud와 iTunes, Firestore의 외부 데이터를 검증한 뒤 애플리케이션 상태로 변환하고 있습니다.

## Tech Stack

- React
- TypeScript
- Vite
- Zustand
- Tailwind CSS
- Firebase Authentication / Firestore
- SoundCloud Widget API
- iTunes Search API
- Cloudflare Workers Static Assets

## Main Features

- 공식 SoundCloud Widget 기반 플레이리스트 재생
- 개인 SoundCloud 플레이리스트 기반 랜덤 트랙 추천
- 현재 곡, 전체 트랙 목록, 재생 상태 동기화
- Likes 트랙 단일 재생, 재생 종료 시 정지 및 기존 플레이리스트 위치 복원
- iTunes Search API 기반 곡 검색과 미리듣기
- SoundCloud와 검색 미리듣기의 상호 재생 정지
- 최근 검색어와 SoundCloud 플레이리스트 업로더 기반 추천 검색어
- 검색 결과를 20개씩 추가 표시하는 더 보기 기능
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
    itunes/        iTunes 검색 페이지, API 서비스, 응답 타입
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

`main` 브랜치에 변경 사항이 반영되면 GitHub Actions가 GitHub Pages와 Cloudflare Workers 배포를 실행합니다. Cloudflare 배포는 `wrangler.toml`을 사용하며, 저장소에 `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` secret이 필요합니다.

## Build Commands

```bash
npm run typecheck
npm run lint
npm run build
```

## 번들 크기 최적화

주요 페이지를 지연 로딩하고 Preline 전체 모듈 대신 Dropdown만 불러오도록 변경했습니다. Vite 빌드 기준 메인 JavaScript 청크는 `1,376.66kB`에서 약 `1,115.62kB`로 약 19% 감소했으며, 남아 있는 공통 의존성 분리는 향후 개선할 예정입니다.

## 문제 해결: 불안정한 SoundCloud API 연동을 공식 Widget으로 전환

### 문제

개발 당시 SoundCloud 공식 API 접근이 제한되어 브라우저 요청에서 확인한 Client ID와 API 요청 구조를 Cloudflare Worker에 적용했습니다. Worker가 플레이리스트 정보를 조회하고 각 트랙의 재생 URL을 변환해 프론트엔드에 전달하는 방식이었습니다.

이 구조는 SoundCloud 측 Client ID나 요청 규격이 변경되면 재생이 중단되어 값을 다시 확인하고 Worker secret을 갱신해야 했습니다. 또한 플레이리스트 조회 후 각 트랙의 재생 URL을 추가로 요청해야 해, 캐시가 없는 초기 접속에서는 재생 목록을 표시하기까지 여러 네트워크 요청이 발생했습니다.

### 해결

유지보수가 어려운 비공식 API 요청과 별도 재생 로직을 제거하고, SoundCloud가 공식 제공하는 Widget API를 재생의 기준으로 변경했습니다. Widget의 `READY`, `PLAY`, `PAUSE`, `PLAY_PROGRESS`, `FINISH` 이벤트를 React 상태와 연결하고 `getSounds`, `getCurrentSound`로 플레이리스트와 현재 트랙 정보를 동기화했습니다.

그 결과 별도의 Client ID 관리, Worker API 프록시, 트랙별 스트림 URL 변환이 필요하지 않게 되었고 SoundCloud가 제공하는 재생 흐름 안에서 플레이어를 유지할 수 있게 되었습니다.

### 상태 관리 구조 개선

기존에는 재생 상태와 제어 로직을 `AudioPlayerContext`에 모아 관리했습니다. 그러나 플레이어 바와 플레이리스트 패널처럼 레이아웃상 떨어진 UI가 현재 트랙, 재생 여부, 재생 시간, 플레이리스트를 함께 사용하고 있어 플레이어 구조가 커질수록 하나의 Context가 담당하는 범위도 넓어졌습니다.

플레이어 구조를 정리하는 과정에서 Widget 인스턴스와 이벤트 연결은 `useSoundCloudWidget` 훅이 담당하고, 여러 UI가 공유해야 하는 재생 상태는 Zustand store로 분리했습니다. 각 컴포넌트는 selector를 통해 필요한 상태만 구독하도록 구성했습니다.

Context로도 Provider와 상태를 세분화해 구현할 수 있지만, 이 프로젝트에서는 서비스의 핵심 기능인 플레이어 상태를 서로 떨어진 UI에서 반복해서 사용하므로 별도 store가 더 단순하다고 판단했습니다. 라이브러리 교체 자체보다 실제 재생을 담당하는 Widget, 외부 이벤트를 연결하는 훅, 화면 간 공유 상태를 보관하는 store의 책임을 구분하는 데 목적을 두었습니다.

### 북마크 단일 재생과 플레이리스트 복귀

플레이리스트 연속 재생과 Likes 트랙의 단일 재생을 `playbackMode`로 구분했습니다. 북마크 재생 중에는 플레이리스트 패널과 이전·다음·랜덤 재생 제어를 비활성화하고, Widget의 `FINISH` 이벤트가 발생하면 다음 곡으로 넘어가지 않고 정지합니다.

북마크 URL을 같은 Widget에 로드하면 기존 플레이리스트의 재생 위치가 사라지므로, 전환 직전에 `getCurrentSoundIndex`와 `getPosition`으로 현재 곡과 시간을 저장합니다. 사용자가 플레이리스트로 돌아가면 저장한 인덱스로 원래 플레이리스트를 로드하고 `seekTo`로 위치를 복원한 뒤, 자동 재생하지 않고 정지 상태를 유지하도록 구성했습니다.

### 트레이드오프

Widget 전환 과정에서 비공식 SoundCloud API 기반 트랙 검색과 스트림 URL 변환은 제거했습니다. 플레이리스트 데이터는 Widget이 제공하는 범위에서 사용하고, 별도의 음악 검색 기능은 공개 iTunes Search API로 분리했습니다. 비공식 SoundCloud API의 기능 범위를 유지하기보다 재생 안정성과 유지보수성을 우선했으며, Widget 내부 구현이나 로딩 방식이 변경될 가능성은 남아 있어 플레이리스트 로딩 상태를 계속 확인해야 합니다.

## 문제 해결: iTunes 검색과 오디오 재생 충돌 방지

### 검색 요청과 외부 응답 검증

사용자가 연속으로 검색할 때 이전 요청의 응답이 최신 결과를 덮어쓰지 않도록 `AbortController`로 진행 중인 요청을 취소했습니다. 이전 요청의 `finally`가 새로운 검색의 로딩 상태를 변경하지 않도록 현재 요청의 컨트롤러도 함께 확인합니다.

iTunes Search API 응답은 `unknown`으로 받은 뒤 응답 객체와 각 트랙의 필수 필드를 런타임에서 검증합니다. 유효한 트랙만 검색 결과로 사용하며 로딩, 빈 결과, 오류 상태를 구분해 표시합니다.

### 미리듣기와 SoundCloud 상호 정지

검색 결과의 `previewUrl`을 별도의 `<audio>` 요소로 재생합니다. 미리듣기가 시작되면 SoundCloud Widget을 정지하고, SoundCloud의 `PLAY` 이벤트가 발생하면 재생 중인 미리듣기를 정지해 두 오디오 소스가 동시에 재생되지 않도록 구성했습니다.

새 검색이나 페이지 이동 시에는 진행 중인 검색 요청을 취소하고 미리듣기 소스와 재생 상태를 함께 초기화합니다.

### 한국 스토어 검색 제한

개발 과정에서 공개 iTunes Search API의 한국 스토어(`country=KR`) 음악 검색 결과가 반환되지 않아, 검색과 미리듣기 기능을 검증할 수 있는 미국 스토어(`country=US`)를 사용했습니다. 따라서 현재 버전에는 한국 스토어 기반 검색이 구현되어 있지 않습니다.

### 검색 결과 단계적 노출

iTunes Search API 공식 문서에 `offset` 기반 페이지네이션이 명시되어 있지 않아 검색당 최대 100개의 결과를 요청합니다. 초기에는 20개만 렌더링하고 사용자가 `20개 더 보기` 버튼을 누를 때마다 다음 결과를 20개씩 추가로 표시합니다.

검색 폼과 미리듣기 버튼에는 키보드로 조작할 수 있는 시맨틱 요소와 상태별 레이블을 적용하고, 결과 목록은 모바일과 데스크톱 화면 크기에 맞춰 열 수가 변경되도록 구성했습니다.

## SoundCloud Widget Track Loading

PlaylistPanel은 기존 UI를 유지하면서 공식 SoundCloud Widget으로 재생을 제어합니다. Widget iframe은 화면에서 보이지 않게 배치하되 항상 마운트하며, `display: none`이나 조건부 렌더링으로 `READY` 이벤트가 막히지 않도록 했습니다.

SoundCloud Widget은 iframe에 실제로 렌더링된 범위만큼 플레이리스트 트랙을 지연 로딩할 수 있습니다. 현재 사용하는 플레이리스트는 최대 35곡이며, iframe 높이를 `3000px`로 설정해 전체 목록이 미리 렌더링되도록 했습니다. Widget 컨테이너는 화면 밖에 절대 위치로 배치하고 overflow-hidden과 포인터 이벤트 차단을 적용해 화면 레이아웃과 사용자 조작에 영향을 주지 않도록 했습니다.

이 방식은 SoundCloud가 공식적으로 보장하는 전체 트랙 조회 API가 아니라 Widget 내부 렌더링 동작을 이용합니다. 플레이리스트 곡 수가 늘거나 Widget 구현이 변경되면 전체 트랙이 로딩되는지 다시 확인해야 합니다.

## 배운 점

- 공식 SoundCloud Widget의 이벤트와 트랙 데이터를 React 전역 상태에 연결해 재생 UI를 동기화하는 방법을 배웠습니다.
- 비공식 외부 API의 넓은 기능 범위보다 공식 연동 방식의 안정성과 유지보수성을 우선하는 판단이 필요하다는 점을 배웠습니다.
- 별도의 Client ID나 비공식 API 요청 없이 Widget이 제공하는 범위 안에서 재생과 트랙 정보를 구성했습니다.
- Widget 이벤트 연결과 화면 간 공유 상태를 분리하고, 여러 UI가 필요한 플레이어 상태만 선택해 구독하도록 구성했습니다.
- 하나의 외부 Widget에서 플레이리스트와 북마크 재생 모드를 전환할 때, 전환 전 상태를 저장하고 로드 완료 후 복원하는 흐름을 구현했습니다.
- 숨겨진 Widget도 `READY` 상태에 도달하려면 항상 마운트되어 있어야 하며, 렌더링 높이가 플레이리스트 트랙의 지연 로딩에 영향을 줄 수 있다는 점을 확인했습니다.
- 외부 트랙 데이터가 항상 유효하다고 가정하지 않고, 필요한 필드를 검증한 뒤 애플리케이션 상태로 변환해야 한다는 점을 배웠습니다.
- 연속 검색 요청을 취소하고 최신 요청만 상태를 갱신하도록 비동기 요청 경쟁 상태를 처리했습니다.
- 서로 다른 오디오 소스의 실제 재생 이벤트를 기준으로 상호 정지시키는 방법을 배웠습니다.
- 인증, 프로필, 게시판, 마이페이지 흐름을 구현하며 라우트 중심의 React 앱 구조와 사용자별 상태 관리 방식을 익혔습니다.

## 향후 개선 사항

- Firebase와 공통 의존성의 청크 분리를 통한 초기 JavaScript 번들 최적화
- SoundCloud 플레이리스트와 게시판·마이페이지의 로딩·빈 상태·오류 상태 보완
- 플레이리스트 로딩과 재생 흐름에 대한 E2E 테스트 추가
