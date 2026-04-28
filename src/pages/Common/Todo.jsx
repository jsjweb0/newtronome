export default function Todo() {
    return (
        <div className="container mx-auto px-4">
            <div className="overflow-y-auto
  [&::-webkit-scrollbar]:w-2
  [&::-webkit-scrollbar-track]:bg-gray-100
  [&::-webkit-scrollbar-thumb]:bg-gray-300
  dark:[&::-webkit-scrollbar-track]:bg-neutral-700
  dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
                <div className="p-1.5 min-w-full inline-block align-middle">
                    <div className="overflow-hidden">
                        <div
                            className="table border-collapse table-auto w-full divide-y divide-gray-200 dark:divide-neutral-700">
                            <div className="table-header-group">
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">기능
                                    </div>
                                    <div
                                        className="table-cell px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase dark:text-neutral-500"> 됨?
                                    </div>
                                    <div
                                        className="table-cell px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase dark:text-neutral-500">Action
                                    </div>
                                </div>
                            </div>
                            <div
                                className="table-row-group divide-y divide-gray-200 bg-white dark:divide-neutral-700 dark:bg-neutral-800">
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">1.
                                        공지사항 목록 출력
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">2.
                                        검색창으로 필터링
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">3.
                                        최신순 / 오래된순 정렬
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">4.
                                        모달 외부 클릭 시 닫기
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200">forwardRef
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">5.
                                        제목 클릭시 showmodal()로 다이얼로그 open
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">6.
                                        더보기로 5개씩 추가로 출력
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">7.
                                        router 상세페이지 이동
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">8.
                                        공지사항 작성하기 (새로 추가)
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200">새
                                        제목 입력하고 목록 추가, useState
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">9.
                                        리스트 삭제 기능
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200">특정
                                        공지를 삭제 filter
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">10.
                                        검색어 강조 (하이라이트)
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200">검색어에
                                        맞는 단어만 mark 태그로 감싸기. dangerouslySetInnerHTML
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">11.
                                        검색어 강조 더 정교하게 (정규식)
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200">Test랑
                                        test 구분
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">12.
                                        공지사항 제목 수정 기능
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200">input으로
                                        수정하고, setNotices()로 업데이트
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">13.
                                        컴포넌트 분리
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">12.
                                        로컬 스토리지에 저장하기
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200">useEffect로
                                        localStorage에 저장, 처음 실행 시 localStorage에서 불러오는 로직 추가
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">13.
                                        토스트 메세지 출력
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">✅
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200">useEffect
                                        : 상태 변화 감지, side effect
                                        <br/>useImperativeHandle : 외부 컨트롤 노출, 반드시 forwardRef 내부에서만, ref로 직접 제어
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">UI
                                        개선 Tailwind나 Styled-Components 적용해보기, useMemo
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">🔺
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">상태관리
                                        useContext나 (Redux, Zustand) 전역 상태 관리 패턴 연습
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200"></div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200">
                                        다크모드, 정렬 상태를 Context로 공유하게 리팩토링
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">React
                                        Testing Library로 렌더링/이벤트 테스트
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200"></div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">비동기
                                        통신 (API 연동) + React Query
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200"></div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200">fetch,
                                        axios로 서버에서 데이터 가져오기
                                        <br/>async/await, useEffect로 side effect 관리
                                        <br/>JSON Server 같은 Mock API로 게시판 서버 구축해서 CRUD 해보기
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">컴포넌트
                                        재사용 + Custom hooks
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200"></div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200">Button,
                                        Input, Modal 등 Atomic Design 패턴으로 분리
                                        <br/>props, children, custom hooks로 컴포넌트 재사용성 높이기
                                        <br/>${`글목록 한 줄을 &PostItem />`} 같은 컴포넌트로 분리
                                    </div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">TypeScript
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200"></div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">Routing
                                        + Next.js
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200"></div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">Form
                                        라이브러리 사용 → React Hook Form
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200"></div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                                <div className="table-row">
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200">Framer
                                        Motion
                                    </div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200"></div>
                                    <div
                                        className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div
                                className="px-6 py-4 text-sm font-normal">
                                <div className="whitespace-pre-wrap font-Prestandard text-sm">
                                    {`
1️⃣ 로그인 + 회원가입 구현
🔐 로그인 + 사용자 정보 관리 - 로그인 상태 관리 (Context or localStorage), 작성자만 수정/삭제 가능
✏️ 글 수정 기능 (디테일 정리) - /board/:boardType/:id/edit 페이지로 이동, 글쓰기 컴포넌트를 재사용
💬 댓글 기능 - 각 글마다 댓글 리스트 (post.comments), 댓글 작성/삭제 기능, 댓글 개수 출력 (댓글 3)
📦 mock API 붙이기 or 백엔드 연동 (json-server → supabase or Firebase)
🎨 UI 고도화 (정렬 UI 개선, 필터 등)
프로필 페이지
관리자만 공지사항 작성 가능하게
검색 기능 고도화(제목, 내용, 작성자까지 검색 범위 확장) / 카테고리별 필터 / 공지글만 보기 / 댓글 많은 순 정렬
상세페이지 기능 보완(조회수, 댓글, 이전글 / 다음글 미리보기 카드 UI 개선)
UX & UI 업그레이드( 로딩 스피너 or Skeleton UI / 로딩 스피너 또는 empty state
다크모드 토글 UI 고도화
Toast 메시지 애니메이션 / 여러 메시지 동시에 처리)
댓글 삭제/수정 시 prompt는 유지하고, 비밀번호는 ****로 표시만 / 🔐 비밀번호 입력 → 입력한 비번은 저장 안 하고 즉시 삭제
대댓글 구조: { id, parentId, writer, comment, ... }
parentId로 계층 렌더링
UI: 들여쓰기 + 댓글 정렬 (최신 순 or 트리 구조)
댓글 수정 시 textarea 자동 포커스
관리자용 대시보드\t데이터 테이블, 필터, 정렬, 차트까지 연습 가능
캘린더 일정 관리\t날짜 다루는 dayjs + UI 구성력
게시판 첨부파일
보호동물 : 기간 필터 (bgnde, endde) / 지역 필터 / 찜 목록만 보기: 목록 페이지에서 likedPets.includes(post.desertionNo)로 필터

📁 src/
├── assets/              # 이미지, 오디오, 아이콘 등 정적 리소스
├── components/          # 공통 UI 컴포넌트
│   ├── layout/          # 레이아웃 (사이드바, 플레이어 등)
│   ├── track/           # 트랙 카드, 트랙 리스트, 테이블 등
│   │   ├──── TrackList.jsx     // 검색 결과 리스트 (썸네일, 타이틀, 아티스트)
│   │   └──── TrackItem.jsx    // 개별 트랙 (썸네일 + 제목 + 플레이 버튼)
│   ├── player/          # 하단 플레이어 관련
│   │   ├──── Player.jsx           // 하단 고정 미니플레이어
│   │   └──── WaveVisualizer.jsx   // 가짜 wave animation bar
│   └── ui/              # 버튼, 토글, 뱃지 등 작은 UI
├── hooks/               # 커스텀 훅 (ex. useAudio, useSoundCloud)
│   └── useSoundCloudApi.js  // API 호출 커스텀 훅
├── pages/               # 라우팅되는 페이지
│   ├── Home.jsx
│   ├── Artist.jsx
│   └── Album.jsx
│       └── TrackDetail.jsx      // 곡 상세페이지 (댓글, 유사 트랙 등)
├── layouts/             # MainLayout.jsx 등 페이지 틀
├── data/                # JSON 더미 데이터 또는 목업
├── styles/              # 전역 스타일, 변수 등
│   └── tailwind.css
├── App.jsx              # 라우터 + 레이아웃 조합
└── main.jsx             # 루트 렌더링


2️⃣ 사운드클라우드 API 연동 & 플레이어 로직
useSoundCloudApi 훅
searchTracks(q) → fetch("https://api-v2.soundcloud.com/search/tracks?q="+q+"&client_id=...")

오디오 플레이어 컨텍스트
AudioContext + useReducer로 전역 상태 관리 currentTrack, isPlaying, playlist[], play(track), pause(), next(), prev() 액션
PlayerBar와 PlaylistPanel 연결
플레이리스트 클릭 → dispatch({ type: "PLAY", track })
PlayerBar에서 isPlaying 토글, audio 엘리먼트 이벤트 바인딩
검색 → 곡 목록 → 플레이

메인 페이지나 헤더 검색창에 searchTracks 호출 - 결과를 리스트로 보여주고, 클릭 시 플레이리스트에 추가

1. 하단 플레이어(PlayerBar) 먼저 - 오디오 컨텍스트 뼈대 잡기
useAudioPlayer 훅으로 재생·일시정지·seek 로직 만들기
PlayerBar UI에 훅 연결
재생 버튼, 진행 바, 곡 정보가 실제로 동작하도록

2. 왼쪽 플레이리스트(PlaylistPanel) - 클릭 시 play(track) 호출
currentTrack 하이라이트, queue 관리 / 리스트 추가·제거 기능


3️⃣ 사이드바 & 레이아웃 인터랙션 사이드바 토글 상태
모바일/태블릿 뷰에서 햄버거 메뉴 누르면 isCollapsed 상태 토글

로그인 & My Page 연동 / AuthContext에서 user 상태 관리 / 로그인 전/후 메뉴 노출 제어
다크모드 토글 - DarkModeToggle 클릭 → document.documentElement.classList.toggle("dark")

5. 좋아요·플레이리스트·내 글 요약
로그인 유저가 누른 좋아요 목록, 내가 쓴 Free Board 글, 내가 생성한 플레이리스트 같은 요약을 옆에 배치
예를 들어 “좋아요 누른 트랙: 12개” → 클릭 시 해당 페이지로 이동
포트폴리오용으로도 “CRUD + 관계형 데이터 모델링”을 잘 보여줄 수 있어요.

6. 디자인·UX 다듬기
폼 상태(Dirty) 감지: 수정 전/후 값이 다를 때만 “저장하기” 버튼 활성화
로딩 스피너: 저장 중엔 버튼에 로딩 인디케이터

회원별 프로필 페이지(내가 좋아한 곡·재생목록 보기)
검색 고도화 - 필터(장르, BPM, 태그 등) / 정렬(인기순·최신순) / 인풋 디바운스, 자동완성(Auto-suggest)
서버사이드 렌더링(SSR) / SEO - Next.js 같은 프레임워크로 SSR 전환 / 메타 태그 동적 관리, 소셜 공유(Open Graph)
분석·통계 대시보드 - plays, likes, 신규 가입자 수 등 간단한 차트 / Recharts / Chart.js로 시각화
PWA: 오프라인 지원 + 홈스크린 추가

케이스 스터디 페이지 - 프로젝트 목표, 기술 스택, 주요 의사 결정(왜 Context/API? 왜 PWA?) 고민했던 부분과 해결 방법(예: 오디오 프리뷰 메모리 릭 방지)
UI/UX 문서화 - 화면 흐름도(Flowchart) 또는 와이어프레임 / 주요 컴포넌트 구조도 / 디자인 시스템
코드 퀄리티 강조 - 컨벤션(ESLint/Prettier) 적용 / 폴더 구조(모듈화) 설명
데모 & 스크린캐스트 - 실제 동작하는 화면 녹화(short GIF) / 모바일·데스크톱 반응형 데모

알림 토스트 메세지 갯수, 이력, 더보기, 삭제
import { useToast } from '../contexts/useToast.js';
import { useNotifications } from '../contexts/useNotifications.js';

function SomeComponent() {
  const { showToast } = useToast();
  const { addNotification, removeNotification } = useNotifications();

  const notify = () => {
    const id = Date.now();
    const notification = { id, message: '새 알림이 도착했습니다!' };
    showToast({ message: notification.message });
    addNotification(notification);

    // 예시: 5초 후 자동 삭제
    setTimeout(() => removeNotification(id), 5000);
  };

  return <button onClick={notify}>알림 보내기</button>;
}

채팅 메시지 도착 / 친구 요청 / 시스템 공지/업데이트 / 댓글·좋아요 알림 / 예약·일정 알림

// notification 객체 예시
const notification = {
  id: 123,                    // (선택) 유니크 ID
  message: '새 메시지가 도착했습니다!',  // 필수: 드롭다운에 뿌릴 텍스트
  type: 'message',            // (선택) message | friend_request | system 등
  timestamp: Date.now(),      // (선택) 생성 시각
  link: '/chats/5',           // (선택) 클릭 시 이동할 경로
  read: false,                // (선택) 읽음/안읽음 상태
};
                                            `}
                                </div>
                            </div>
                            <div
                                className="table-cell px-6 py-4 whitespace-nowrap text-sm font-normal text-gray-800 dark:text-neutral-200"></div>
                            <div
                                className="table-cell px-6 py-4 whitespace-nowrap text-start text-gray-800 dark:text-neutral-200"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}