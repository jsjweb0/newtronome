# NEWTRONOME 통합 코드 리뷰 보고서

> 최초 분석 기준: `07466c0` (2026-11-26). 아래 현재 상태는 2026-11-27 작업 폴더와 검증 결과를 반영한다. 커밋·운영 배포 완료를 뜻하지 않는다.
> 통합 대상: 같은 날 진행한 리뷰 5건
> 1. 복잡도·가독성 리뷰(재검증본)
> 2. 잠재 버그 분석
> 3. 아키텍처 분석
> 4. 성능 분석
> 5. 보안·배포 검토
>
> 방법: 각 지적을 소스에서 다시 확인했다. 중복은 병합하고, 상충하는 제안은 조건을 붙여 정리했으며, 근거가 약하거나 과한 제안은 제외했다.
> 한계:
> - 최초 분석에서는 검증 명령을 실행하지 않았다. 현재 자동 검증 결과는 아래에 기록한다. Lighthouse·Profiler는 미실행이며 성능 개선 수치는 없다.
> - 운영 Firestore Rules는 기존 Firebase CLI 로그인으로 Rules API에서 읽기 전용 조회했다. Cloudflare·GitHub 콘솔 설정은 확인하지 않았다.
> - 최초 분석은 읽기 전용이었다. 이후 승인된 수정과 테스트가 작업 폴더에 반영됐다.

---

## 1. 결론 요약

| 상태 | 항목 | 확인 결과 |
|---|---|---|
| 구현·자동 검증 완료 | M2·M3·R1·B6·B5 | 인증 대기, 부분 조회 실패, 미사용 코드, 프로필 검증, 계정별 알림 초기화 반영 |
| 문서 수정 완료 | M1 | E2E와 배포 워크플로의 검증 조건을 구분 |
| 운영 대조 완료 | M4 | 조회 시 운영 Rules가 수정 전 `HEAD:firestore.rules`와 일치 |
| 구현·자동 검증 완료, 운영 미적용 | S3 | 댓글 작성 시각 서버 저장과 생성 규칙 검사 추가. 운영 규칙에는 이번 서버 시각·입력 제약 변경이 미적용 |
| 다음 검토 | B3·B4 실제 브라우저 → P1·P2·P3 측정 → R2·R5 | 사용자 영향·측정·기존 데이터 호환성을 기준으로 진행 |

재생 요청·상태 소유권과 UI·Rules 권한 분리 등 기존 경계는 유지한다. 유지 판단이 모든 세부 구현의 정확성을 보증하는 것은 아니다.

### 이번 검증과 남은 범위

- 최종 브라우저 회귀: `npm run test:e2e -- --project=playback-desktop --project=playback-mobile --project=board-chromium` 25건 통과. 초기 실행은 24/25였으며 모바일 `tests/e2e/playback.spec.js:60`의 빈 목록 재시도에서 READY 발생 후 main에 빈 목록 문구를 기대했으나 로딩 article만 남아 10초 초과했다. 동일 항목 반복 3/3 및 전체 재실행 25/25 통과. 기대값·대기 시간을 변경하지 않았다. 최초 실패의 정확한 원인은 미확정이며 해결된 버그로 기록하지 않는다.

- S1·S8 로컬 구현·검증 완료, 운영 미배포. 제목 100자·본문 10,000자·댓글 1,000자·닉네임 8자. 공백 입력과 자유게시판의 미지원 카테고리를 거부한다. 공지의 새 카테고리는 null이다.
- 길이는 Unicode 코드 포인트 기준이다. JS Array.from과 Rules의 RE2 문자 치환으로 같은 기준을 적용했다. 이모지 경계값도 검사했다.
- Rules는 생성과 변경된 입력 필드만 검사한다. 관리자 경로도 포함한다. 기존 긴 글·예전 카테고리의 좋아요·조회수·다른 필드 수정, 기존 긴 댓글의 좋아요, 기존 긴 닉네임의 다른 필드 갱신은 유지된다. 프로필 문서의 닉네임 필드는 생략할 수 있으며, 새로 지정하거나 바꿀 때는 유효해야 한다. 기존 데이터 정리·마이그레이션은 하지 않았다.
- 폼: PostForm, PostCommentSection, Comment, utils/profile. 공통 기준: constants/boardValidation.ts, utils/text.ts. 서버 강제: firestore.rules. 새 입력 실패 시 기존 입력을 유지하고 관련 필드로 포커스를 돌린다.
- URL: utils/url.ts의 toHttpsUrl을 mapSoundCloudWidgetTrack, savedTracks 저장·읽기, iTunes 검색·아티스트 곡 응답에 연결했다. 잘못된 선택 URL만 null/undefined로 비우고 곡은 유지한다. HTTPS와 사용자 정보 없는 절대 URL을 허용하며, 특정 도메인 목록은 강제하지 않는다. 프로필 사진의 기존 HTTP(S) 검사는 변경하지 않았다.
- 추가 회귀 검증: 폼 생성·수정 길이 초과와 입력 유지, 기존 긴 본문 수정, URL 정리·곡 유지, 닉네임 및 한글·이모지 경계값. Rules 34건을 추가했고, 기존 정상 수정 테스트의 자유게시판 category:null은 새 정책에 맞는 chat으로 변경했다. 임의 카테고리 거부를 별도로 검사한다.
- 신규/보완 테스트: Comment.test.tsx, PostForm.test.tsx, PostCommentSection.test.tsx, profile.test.ts, url.test.ts, mapSoundCloudWidgetTrack.test.ts, savedTracks.test.ts, searchITunesTracks.test.ts, getArtistTracks.test.ts, tests/firestore.rules.test.ts.

- LikeButton: 비로그인 전달값 반영과 Firestore 구독을 분리했다. 로그인 중 initialCount 변경은 재구독하지 않는다. 하트·추천 버튼은 aria-disabled와 클릭 가드로 중복 요청을 막으며 저장 대기 안내를 표시한다.
- LikeButton 테스트는 23건 통과했다. 추가 7건은 로그인·비로그인 전달값 변경, 로그인 전환, 두 버튼의 지연 응답·성공·실패와 DOM 포커스 유지를 확인한다. 기존 disabled 검사 2건은 aria-disabled와 실제 쓰기 차단 검사로 변경했다. 실제 브라우저 Tab·Enter·Space 동작과 오프라인 재연결은 미검증이다.
- B3: LikeButton과 트랙·플레이리스트 북마크의 서버 반영 대기 안내를 추가했다. 북마크 버튼은 aria-busy를 표시하며, 서버 응답 전에는 기존 중복 쓰기 차단을 유지한다. 저장·삭제의 대기·성공·실패 테스트 8건을 추가했다. 트랙 안내는 버튼과 한 묶음으로 배치해 패널 그리드의 별도 항목이 되지 않도록 했다. 실제 오프라인 재연결 및 좁은 화면의 대기 안내 배치는 미검증이다. B4는 코드·컴포넌트 검증을 마쳤고 실제 브라우저 키보드 확인이 남아 있다.

- `npm run typecheck`, `npm run lint`, `npm run test:run`, `npm run build` 통과. 단위·컴포넌트 테스트는 54개 파일, 508개 테스트 통과.
- `npm run test:rules` 통과: 85개 테스트. 자유·공지 게시판에서 서버 작성 시각 허용, 과거·미래 클라이언트 시각 거부를 추가 검증했다.
- 댓글 서비스 테스트는 서버 시각 sentinel 저장과 표시용 Date 반환을 확인한다.
- 빌드에는 기존 500 kB 초과 청크 경고가 있다.
- 운영 프로젝트 `free-board-15f7f`의 기본 Firestore release를 조회해 수정 전 저장소 규칙과 줄바꿈 정규화 후 일치를 확인했다. 이후 추가한 서버 시각·입력 제약 조건은 운영에 배포하지 않았다.
- 기존 댓글 시각을 마이그레이션하지 않는다. 새 조건은 생성에만 적용하며 기존 댓글 수정·좋아요 규칙은 유지한다.
- 프론트엔드를 먼저 배포·확인한 뒤 Rules를 배포해야 한다. 이전 프론트엔드가 열린 탭은 클라이언트 시각을 보내므로 새 Rules 적용 후 댓글 생성이 거부될 수 있어 새로고침이 필요하다.
- 북마크 UI 변경 후 `npm run test:e2e -- --project=playback-desktop --project=playback-mobile` 실행: Mock 기반 Chromium 데스크톱·모바일 12건 통과. 실제 Firebase 댓글·북마크 쓰기, 실제 SoundCloud 음원 출력, Lighthouse·Profiler는 미검증이다. S1 입력 제약 변경 후 test:rules를 재실행해 85건 통과했다.
- `npm audit --omit=dev`는 레지스트리 DNS 조회 실패로 완료하지 못했다. 과거 취약점 수를 현재 결과로 인용하지 않는다.

---

## 2. 반드시 수정 (포트폴리오 제출 전)

### M1. README의 배포 조건 설명이 실제 워크플로와 다름

> 현재 상태: 완료 — README의 검증·배포 조건을 수정했다.

| 항목 | 내용 |
|---|---|
| 위치 | `README.md:26`, `.github/workflows/deploy.yml`, `.github/workflows/playwright.yml` |
| 근거 | README는 "단위·컴포넌트 테스트, Playwright E2E, Firestore 규칙 테스트를 PR마다 GitHub Actions에서 실행하고, **통과한 경우에만 배포**합니다"라고 쓴다. 실제 `deploy.yml`은 타입·린트·단위·빌드·Rules 테스트만 실행한 뒤 배포한다. E2E 단계가 없고 `needs`·`workflow_run` 연결도 없다. E2E는 별도 워크플로(`playwright.yml`)에서 실행된다. |
| 왜 필수인가 | 면접관이 워크플로 파일을 열면 바로 확인되는 사실 불일치다. 다른 검증 주장의 신뢰도까지 떨어뜨린다. |
| 해결 | **README 문장 수정(권장)**: "PR마다 단위·E2E·규칙 테스트를 실행하고, 배포는 타입·린트·단위·빌드·규칙 테스트를 통과한 경우에만 진행합니다." |
| 대안 | 배포를 E2E 성공에 묶는다(`deploy`에 E2E job 추가 후 `needs`). 배포 시간이 늘고, E2E가 불안정하면 배포가 막힌다. 제출 전에는 문서 수정이 맞다. |
| 영향도 / 위험도 | 신뢰도 높음 / 위험 없음(문서) |

### M2. 글쓰기·수정 페이지에서 새로고침하면 로그인 확인 전에 다른 페이지로 이동

> 현재 상태: 완료 — 인증 대기 분기와 로그인·비로그인 복원 회귀 테스트가 통과했다.

| 항목 | 내용 |
|---|---|
| 위치 | `src/pages/board/PostWritePage.tsx:34, 77`, `src/pages/board/EditPostPage.tsx:39, 123~129` |
| 근거 | 두 페이지 모두 `useAuth()`에서 `user`만 읽는다. `AuthProvider`는 `getDoc`과 `getIdTokenResult`가 끝난 뒤에 `setUser`·`setLoading(false)`를 호출하므로(`AuthProvider.tsx:104~145`), 새로고침 직후에는 `user === null`이다. 그 사이 글쓰기는 `/login`, 수정은 게시판 목록으로 `replace` 이동한다. 같은 저장소의 `MyActivity.tsx:21`, `AccountProfile.tsx:58`, `AuthAccess.tsx`, `LikedTracksPage`는 `loading`을 먼저 확인한다. |
| 재현 | 로그인 → 글쓰기 또는 수정 페이지 → DevTools를 Slow 4G로 설정 → 새로고침. lazy chunk 로딩과 경쟁하므로 빠른 네트워크에서는 재현이 들쭉날쭉할 수 있다. |
| 왜 필수인가 | 데모 링크를 새 탭으로 열거나 새로고침하는 평범한 사용에서 드러나는 기능 결함이다. |
| 해결 | `const { user, loading } = useAuth(); if (loading) return <상태 안내 />;`를 리다이렉트 판단 앞에 둔다(`MyActivity`와 같은 형태). 수정 페이지는 `loading`이 끝난 뒤에만 `canEdit`를 판단한다. |
| 검증 | `loading: true`일 때 리다이렉트하지 않는 컴포넌트 테스트를 추가하고, 수동으로 새로고침 재현 절차를 확인한다. |
| 영향도 / 위험도 | 높음 / 낮음(분기 추가, 기존 패턴 재사용) |

### M3. 프로필 조회가 실패하면 관리자 권한(claim)까지 버려짐

> 현재 상태: 완료 — `Promise.allSettled`와 부분 실패·늦은 응답 회귀 테스트가 통과했다.

| 항목 | 내용 |
|---|---|
| 위치 | `src/contexts/AuthProvider.tsx:104~107`(`Promise.all`), `:129~145`(catch에서 `isAdmin: false`), `:163~190`(프로필 구독이 `isAdmin`을 갱신하지 않음) |
| 근거 | 프로필 `getDoc`이 실패하면 함께 묶인 claim 결과도 버려진다. 이후 프로필 스냅샷은 닉네임·사진만 병합하므로 새로고침 전까지 관리자 기능(공지 작성 토글, 타인 글 수정)이 사라진다. |
| 재현 | 관리자 로그인 → DevTools Request blocking에 `firestore.googleapis.com` 추가 → 새로고침 → 차단 해제 → 관리자 UI가 보이지 않음 |
| 왜 필수인가 | README가 관리자 권한을 claim으로 처리한다고 설명하는 영역이다. 네트워크가 불안정한 시연 환경에서 관리자 기능이 사라지면 설명과 어긋난다. |
| 해결 | `Promise.allSettled`로 바꾸고 각 결과를 따로 반영한다(claim 성공 시 `isAdmin` 유지, 프로필 실패 시 닉네임만 비움). |
| 보안 | 권한이 줄어드는 방향(fail-closed)이라 보안 문제는 아니다. 쓰기 권한은 Rules가 판단한다. |
| 영향도 / 위험도 | 중간 / 낮음(함수 하나 안에서 변경) |

### M4. 운영 중인 Firestore Rules가 저장소와 같은지 확인

> 현재 상태: 대조 완료 — 조회 시 운영 규칙은 수정 전 저장소와 일치했다. 이번 S1·S3 조건은 로컬에만 추가됐다.

| 항목 | 내용 |
|---|---|
| 위치 | `firebase.json`, `.github/workflows/deploy.yml` |
| 근거 | CI는 Rules를 **테스트**하지만 **배포**하지 않는다(`firebase deploy --only firestore:rules` 단계 없음). 운영 Rules가 저장소 파일과 다를 수 있다(확인 불가). |
| 왜 필수인가 | 포트폴리오가 Rules와 Rules 테스트를 보안 근거로 제시한다면, 운영 규칙이 같다는 전제가 있어야 그 주장이 성립한다. |
| 해결 | Firebase 콘솔 → Firestore → 규칙의 현재 내용과 `firestore.rules`를 대조한다. 다르면 의도된 차이인지 검토하고, 테스트와 적용 순서를 확인한 뒤 배포 여부를 결정한다. README에는 이미 수동 Rules 배포가 명시돼 있다. **코드 변경 없음.** |
| 영향도 / 위험도 | 확인 작업은 읽기 전용. 운영 배포는 접근 권한을 변경하므로 별도 검토 필요 |

---

## 3. 제출 전 권장 (위험 매우 낮음, 효과 분명)

원래 후보 목록이다. R1·B6·B5는 완료했고 S3는 로컬 구현·검증을 완료했다. 실제 우선순위는 9절을 따른다.

| ID | 내용 | 위치 | 효과 | 위험 | 검증 |
|---|---|---|---|---|---|
| R1 | 사용처 없는 파일 3개·함수 3개 삭제 | `components/layout/Footer.tsx`, `components/player/PlaylistPanelSkeleton.tsx`, `components/icons/AudioLinesOffIcon.tsx`, `utils/format.ts:35 formatCount`, `utils/image.ts:16 getArtworkOrFallback`, `utils/profile.ts:81 isProfileModified` | 코드를 읽는 사람의 혼란 제거. 소스·테스트 전체에서 참조 0건을 재확인함 | 매우 낮음 | `typecheck`, lint, test:run, build 완료 |
| R2 | 죽은 주석, 불필요한 `?.`, 단일 자식 fragment | `layouts/MainLayout.tsx:347`, `components/board/Comment.tsx:129`, `pages/HomePage.tsx:37·45`(필수 타입인데 `?.` 사용), `LikedTracksPage.tsx:229·278` | 표기 정리 | 매우 낮음 | `tsc`, 해당 테스트 |
| B6 | 프로필 검증 실패 시 비밀번호 입력 3칸이 초기화됨 | `pages/user/AccountProfile.tsx:147~156`(try 안 `return`) → `:227~231`(`finally`) | 사용자 입력 손실 방지 | 낮음 | try 앞 이동 완료. 입력 유지·서버 호출 차단·수정 후 재저장 테스트 통과 |
| B5 | 로그아웃 후 다른 계정에 이전 계정 알림이 남음 | `main.tsx:52`(`NotificationProvider`가 `AuthProvider` 바깥), `contexts/NotificationProvider.tsx` | 계정 간 활동 흔적 노출 차단 | 낮음 | uid 변경 시 초기화 완료. 같은 uid 유지·로그아웃·계정 전환 테스트 통과 |
| P3 | SoundCloud SDK 동기 스크립트가 HTML 파싱을 막음 | `index.html:70` | 첫 렌더 지연 감소(크기는 측정 필요) | 낮음 | `defer`를 추가해도 module 스크립트보다 먼저 실행되는 순서는 유지된다. Lighthouse 및 실제 SDK 로딩 순서·재생 확인. Mock E2E만으로 SDK 로딩을 검증할 수 없음 |
| P1·P2 | 히어로 슬라이더가 모든 곡의 `t1080x1080` 이미지를 즉시 요청하고, 목록·패널 썸네일에 지연 로딩이 없음 | `PlaylistHero.tsx:51~56`, `Slider.tsx:132`, `TrackItem.tsx:112`, `PlaylistPanel.tsx:216·394` | 첫 화면 이미지 요청 감소(수치는 Network 패널로 측정) | 낮음 | 첫 화면 중앙·인접 슬라이드는 즉시 표시하고 화면 밖 이미지의 지연 로딩을 검토. Network 패널 Img 요청 수를 전후 비교 |
| S3 | 댓글 작성 시각을 클라이언트가 정함(정렬 조작 가능) | `firestore.rules:134`(`is timestamp`만 확인. 게시글은 92행에서 `== request.time` 강제), `commentsService.ts:179`(`Timestamp.now()`) | 데이터 무결성 | 낮음 | Rules에 `== request.time` 추가, 저장은 `serverTimestamp()`. 반환값은 화면 즉시 표시용으로 로컬 시각 유지. 서비스·Rules 수정 및 테스트 통과. 운영 적용은 별도 |
| R5 | 패널 `collapsed` prop이 실제로는 "열림"을 뜻함 | `PlayerBar.tsx:251`(`aria-expanded={collapsed}`), `PlaylistPanel.tsx:153`(`data-state={collapsed ? 'open' : ...}`), `HeaderButtons`, `NotificationDropdown`, `MainLayout.isPanelCollapsed` | 접근성 속성의 오독 방지. 면접에서 코드를 함께 볼 때 혼란 제거 | 낮음(이름만 변경, 소스 5개 + 테스트 2개). `Sidebar`의 `collapsed`는 의미가 맞으므로 제외 | `tsc`, PlayerBar·PlaylistPanel·MainLayout 테스트 |

---

## 4. 선택적 개선 (측정·제품 판단 후)

| ID | 내용 | 근거 위치 | 먼저 할 일 | 위험 |
|---|---|---|---|---|
| S1 | Rules에 문자열 길이·`https://`·카테고리 검증 추가 | `firestore.rules` `isValidPostCreate`·`isValidCommentCreate`·`users` 규칙 | **상충 주의**: `isValidPostAfterUpdate`에 길이 제한을 넣으면 기존 긴 글의 좋아요·조회수 갱신까지 막힌다. 생성과 본문 수정 규칙에만 추가하고 기존 데이터 길이를 먼저 확인한다 | 중간 |
| S2 | 쓰기 남용 방지(예산 알림 → App Check), 조회수 증가가 비로그인에도 무제한 허용됨 | `firestore.rules:285~291` | 조회수를 비로그인에게도 열어 둘지 제품 판단. 콘솔 예산 알림은 즉시 가능 | 낮음~중간 |
| S4 | 보안 헤더(CSP, frame-ancestors) | `workers/frontend.js`, `public/`(`_headers` 없음) | Cloudflare 측 설정 확인. 적용 시 Report-Only로 시작하고 인라인 테마 스크립트 해시 필요 | 중간 |
| B3 | 오프라인·지연 시 좋아요·북마크 버튼이 잠긴 채 유지 | `LikeButton.tsx:135~180`, `useTrackBookmark.ts:83~107`, `usePlaylistBookmark.ts:70~83` | Firestore 쓰기 Promise 동작(SDK 문서)을 오프라인으로 수동 재현. 우선 대기 상태 안내를 검토하며 타임아웃으로 쓰기를 취소한 것으로 간주하지 않는다 | 구현에 따라 중간 |
| B4 | 댓글 좋아요 후 버튼 재비활성화·포커스 이탈 | `LikeButton.tsx:73·109~115·189`, `Comment.tsx:168` | 키보드 수동 확인. 고치려면 비로그인 전달값 반영과 로그인 구독을 분리하고 `disabled` 대신 `aria-disabled`를 쓴다. 기존 테스트의 `disabled` 단언 확인 필요 | 낮음~중간 |
| A1 | `LikeButton`·`AccountProfile`의 Firestore 직접 호출을 서비스로 이동 | 위 두 파일 | B4를 고칠 때 함께 하면 비용이 작다. 단독으로 제출 전에 할 필요는 없다 | 낮음 |
| B7 | 미리듣기를 빠르게 두 번 누르면 정지 대신 재시작 | `ITunesSearchPage.tsx:239~280` | 느린 네트워크에서 재현 확인 | 낮음 |
| B8 | 청크 로드 실패 자동 새로고침이 세션당 1회 | `main.tsx:16~31` | 오류 경계의 새로고침 버튼으로 복구 가능하므로 낮은 우선순위 | 낮음 |
| P4 | 폰트 CSS `@import` 직렬 요청 | `assets/css/index.css:1~2` | Network 워터폴 측정 | 낮음 |
| P5 | 북마크 버튼마다 문서 구독(홈 기준 곡 수 × 2 + 2개) | `useTrackBookmark.ts`, `TrackItemActions.tsx:37`, `PlaylistPanel.tsx:265·435`, `PlayerBar.tsx:235` | Firebase 사용량 측정. 필요할 때만 컬렉션 1회 구독으로 공유 | 중간(Context 추가) |
| P6 | 재생 중 `PlayerBar` 전체 리렌더링 | `PlayerBar.tsx:39`, `useSoundCloudWidget.ts:592~604` | React Profiler 측정. 필요할 때만 진행 바를 자식 컴포넌트로 분리하고, 슬라이더 배경 로직은 그대로 옮긴다 | 낮음 |
| P7 | 게시판 목록·상세가 컬렉션 전체를 읽고, 행마다 댓글 수를 조회 | `postsService.ts:94` `fetchPostsFromFirestore`, `PostItem.tsx:46` | 게시글 수가 늘어 측정상 문제가 될 때만. 서버 페이지네이션은 클라이언트 검색 재설계가 필요 | 높음 |
| P8 | Firebase Analytics를 시작 시 정적 import | `firebase.ts` | 수집이 필요한지 제품 판단 후 지연 초기화 또는 제거 | 낮음 |
| S7 | 게시글 삭제 후 댓글이 남음 | `postsService.ts` `deletePostFromFirestore` | `postExists`·삭제된 부모 글 UI·Rules 테스트가 이미 있음. 보존·삭제 정책을 먼저 결정하고 임의 정리하지 않음 | 낮음 |
| S8 | 외부·저장 데이터 URL을 `href`에 쓸 때 스킴 검증 없음(본인 데이터만 영향) | `isSavedTrack`, `isITunesTrack`, `mapSoundCloudWidgetTrack` | `https://`만 허용 | 낮음 |
| S9 | 의존성: 운영 경로 high 4개(`@grpc/grpc-js` 전파, 2026-11-12 문서 기준) | `docs/dependency-security-phase1.md` | 로컬에서 `npm audit --omit=dev` 재실행. 빌드 결과에 grpc-js가 포함되는지 확인 | 중간(SDK 업그레이드) |
| R6 | 추천 아티스트 `useState` + `useEffect` → `useMemo` | `ITunesSearchPage.tsx:54·144~170` | `Math.random()` 셔플이 포함되어 단순 useMemo 전환은 제외. 현재 유지 | 해당 없음 |
| A3·A4 | 배치 규칙과 `PlayerTrack` 필드 변경 체크리스트 문서화 | `AGENTS.md`, `docs/` | 문서만 | 없음 |

---

## 5. 상충하는 제안 검증 결과

| 제안 A | 제안 B | 판정 |
|---|---|---|
| A1: 서비스 계층으로 이동(아키텍처) | "새 추상화 최소화"(복잡도 리뷰) | 기존 서비스 패턴을 따르는 이동이라 새 개념은 아니다. 다만 동작 이득이 없으므로 필요성이 확인될 때 별도로 검토. B4 수정과 자동으로 묶지 않음 |
| P6: `PlayerBar` 진행 바 분리(성능) | 슬라이더 배경 명령형 갱신 유지(복잡도 리뷰) | 충돌 없음. 분리하더라도 `updateRangeBackground` 로직은 그대로 자식으로 옮긴다. 둘 다 Profiler 측정 후 판단 |
| P5: 북마크 구독 공유(성능) | Context 추가 비권장(아키텍처) | 양쪽 모두 "측정 후"로 일치. 제출 전에는 하지 않음 |
| S1: Rules 길이 제한(보안) | 기존 데이터·좋아요 갱신 | `isValidPostAfterUpdate`에 넣으면 기존 문서 갱신이 막힐 수 있다. **생성·본문 수정 규칙에만** 추가 |
| M1: README 수정 | S10: 배포를 E2E에 연결 | 제출 전에는 README 수정. 워크플로 변경은 선택 |
| S3: 댓글 서버 시각 | 화면 즉시 표시 | 저장은 `serverTimestamp()`, 반환값은 로컬 시각 유지 → 충돌 없음 |
| P2: 썸네일 지연 로딩 | 패널 썸네일 크기 축소(초기 성능 아이디어) | 패널과 목록이 같은 `t500x500` URL을 공유해 캐시가 재사용된다. 요청 수와 전송량을 함께 측정. 크기 축소를 영구 제외하지 않고 지연 로딩부터 검토 |
| R5: `collapsed` 이름 변경 | `Sidebar`의 `collapsed` | 의미가 다른 같은 이름이라 패널 계열만 변경 |

---

## 6. 현재 구조를 유지해야 하는 항목

| 설계 | 근거 | 유지 이유 |
|---|---|---|
| 요청 객체 동일성 비교 + 로드·조회 버전 ref | `useSoundCloudWidget.ts`, `docs/player-refactoring-plan.md` DEC-04·06 | 빠른 재선택·늦은 응답 처리의 핵심. 테스트로 보호됨 |
| `playAfterLoad`·`isPlaybackLoading` 분리, Pause가 의도만 취소 | DEC-02·03 | 로딩 중 일시정지 정확성 |
| 불완전한 위젯 응답을 기존 기한 안에서 재조회 | DEC-07, `confirmLoadedTrack` | 실제 SDK에서 찾은 오류의 해결책 |
| `useSoundCloudWidget` 단일 effect·추가 분할 안 함, `ReturnType` 계약 유지 | 계획 문서 164행 | 클로저 공유로 분할 시 오히려 복잡. 문서에서 의도적으로 보류 |
| `useSoundCloudControls` 분리와 이름 있는 래퍼 | `PlayerBar.tsx:171·204·219` 사용 | 의도를 드러냄 |
| Zustand는 재생 상태에만, 서버 상태는 Query·onSnapshot | `usePlayerStore.ts`, `features/board/hooks` | 이 규모에 맞는 경계 |
| 명령은 Outlet context, 상태는 스토어 | `MainLayout.tsx:241~255` | 페이지가 위젯을 직접 만지지 않음 |
| 상세 페이지의 별도 숨김 iframe | `usePlaylistTracks.ts` 주석 | 재생 큐 보호 |
| 외부 응답 검증 함수(`map…`/`is…`) | player·itunes·bookmarks | 경계 검증 |
| Rules 필드 화이트리스트, 좋아요 ±1·UID 검증, 게시글 번호 트랜잭션 | `firestore.rules`, `postsService.ts:163` | 핵심 보안·무결성 |
| `AuthAccess`(UI)와 Rules(권한) 분리 | `AuthAccess.tsx` 주석 | 올바른 책임 분리 |
| `AuthProvider.authRequestIdRef`, `LikedTracksPage.loadedUserUid`, `usePlaylistBookmark.stateKey` | 각 파일 | 오래된 응답·사용자 전환 가드 |
| `ToastProvider` ↔ `Toast` ref 호출 | `contexts/ToastProvider.tsx` | Provider 값이 안정되어 소비자가 재렌더링되지 않음 |
| `PlaylistPanel` 포커스 트랩, 게시판 훅·쿼리 키 구조 | 각 파일 | 접근성, TanStack Query 관례 |

---

## 7. 제거하거나 하향한 지적

| 지적 | 처리 | 이유 |
|---|---|---|
| `widgetRef`를 반환만 하고 쓰지 않음 | 제거(오류) | `useSoundCloudControls`가 입력으로 사용 |
| `PlaylistPanel`·`PlayerBar`가 훅 전체를 prop으로 받음 | 제거 | `SoundCloudWidget`에 `controller`로 전달해야 함 + 문서상 보류 결정 |
| `selectTrack`의 `setWidgetError(null)` 중복(183·242행) | 제거 | 두 호출 사이에 다른 분기가 있어 중복으로 확정할 수 없음 |
| stale-check 조건 반복 정리 | 제거 | 코어 재생 위험 대비 이득 작음 |
| `isPlaylistLoading`·SDK 타입 미사용 멤버 제거 | 제거 | 문서상 보류 결정. 테스트 mock이 참조 |
| `isRecord`·`isPlayerTrack`·재시도 상수 공유 | 제거 | 공용 모듈이 늘어나는 비용이 더 큼 |
| `usePlaylistTracks`와 위젯 훅의 조회 루프 공유 | 제거 | 문서화된 범위 결정 |
| `PlayerBar` 슬라이더 배경 선언형 전환 | 제거 | 드래그 상태 추가로 동작 변경 위험 |
| `MainLayout`의 store 구독을 패널로 이동 | 제거 | 효과 미미, 테스트 수정 필요 |
| Outlet context `useMemo`, Provider `useCallback` 정리 | 제거 | 고빈도 경로가 아님 |
| `LikedTracksPage`의 `loadedUserUid`·재시도 `setIsLoading` 중복 | 제거 | 필요한 가드 / 효과 미미 |
| `savedTracks` 필드 복사·동일 오류 분기 병합 | 제거 | 효과 미미 |
| `PlayerOutletContext` 타입 위치 이동 | 제거 | 런타임 순환 없음, 취향 문제 |
| 게시판·플레이어 UI 파일 일괄 이동 | 제거 | 큰 diff, 동작 이득 없음(A3 문서화로 대체) |
| `MainLayout` 재생 오케스트레이션 분리 | 제거 | 상태·콜백 재전달로 파일만 증가 |
| 북마크·좋아요를 TanStack Query로 통일, Redux·레이어드 구조 | 제거 | 실시간 요구사항, 규모 대비 과도 |
| 단일 곡 클릭 정책 공통 훅 | 보류 | 사용처 2곳. 세 번째 사용처가 생길 때 검토 |
| iTunes 최근 검색 훅 분리 | 제거 | 새 추상화 |
| 패널 썸네일 크기 축소 | 제거 | 같은 URL의 캐시 공유는 장점이나 전송량을 포함한 측정 전에는 결론 보류 |

### 추측으로 남긴 항목(확정하지 않음)
- **S1(잠재 버그)**: 오류 후 남은 전체 재생 대기 상태 때문에 재시도 시 자동 재생됨 → 의도된 동작일 수 있음
- **S2(잠재 버그)**: 조회수 +2 표시
- **S3(잠재 버그)**: 알림 id 충돌
- **S4(잠재 버그)**: 패널 상단 북마크는 key 없이 현재 곡을 전달해 인스턴스 재사용 가능. 이전 상태 표시의 실제 영향은 추가 검증 필요

---

## 8. 포트폴리오 서술 시 주의

- **성능 수치**: 측정하지 않았으므로 성능 개선 수치를 쓰지 않는다.
- **테스트 수**: 현재 실행에서 단위·컴포넌트 54개 파일·508개 테스트, Rules 85개 테스트가 통과했다. 두 명령의 집계를 구분한다.
- **"통과한 경우에만 배포"**: M1을 수정한 문장으로 쓴다.
- **Rules 보안 주장**: M4 대조는 완료했으나 S3는 운영 미적용이다. 로컬 검증과 운영 적용을 구분한다.
- **면접 대비**: 위 "유지" 항목이 설계 판단을 설명할 수 있는 근거다. 특히 DEC-02·04·06·07은 코드와 테스트로 뒷받침된다.

---

## 9. 현재 실행 순서

1. 완료: M1 문서 최신화, M4 운영 Rules 읽기 전용 대조.
2. 완료: M2·M3·R1·B6·B5 구현과 자동 검증.
3. 로컬 완료: S3 서버 작성 시각 저장·생성 규칙·서비스 및 Rules 테스트. 운영 적용 시 프론트엔드 → Rules 순서와 이전 탭 영향을 확인한다.
4. 다음: B3·B4 실제 브라우저 오프라인·키보드 검증. 좋아요·북마크 대기 안내와 LikeButton 구독 분리·포커스 유지 코드는 반영하고 컴포넌트 테스트를 통과했다.
5. 이후: P1·P2·P3 리소스 로딩 측정·개선, 실제 SDK 검증.
6. S1·S8 로컬 구현·검증 완료. 운영 배포 및 실제 Firebase 통합 확인은 남아 있다. 이후 R2·R5를 정리한다.

코드 변경 후 typecheck·lint·test:run·build를 실행한다. Rules 변경은 test:rules, 재생 UI·Widget 연결 변경은 지정된 재생 E2E와 실제 브라우저 검증을 추가한다.
