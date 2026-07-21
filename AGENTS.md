# AGENTS.md

## Project overview

Newtronome은 React 기반의 SoundCloud 플레이리스트 재생 및 커뮤니티 서비스다.

주요 기능:

- SoundCloud Widget 기반 플레이리스트 재생
- 플레이리스트와 재생목록 관리
- 랜덤 재생
- Firebase 로그인
- 좋아요와 사용자 활동
- 게시판
- 반응형 UI
- Cloudflare Workers Static Assets 기반 프론트엔드 배포

기술 스택:

- React
- TypeScript 점진 도입
- Vite
- Tailwind CSS
- Firebase Authentication / Firestore
- Cloudflare Workers Static Assets
- SoundCloud Widget API

## Development rules

- 기존 기능과 데이터 구조를 임의로 변경하지 않는다.
- 수정 범위는 가능한 한 작게 유지한다.
- 요청과 관계없는 파일은 함께 리팩터링하지 않는다.
- 프로덕션 의존성을 추가하기 전에 사용자에게 확인한다.
- 단순히 파일이 길다는 이유로 컴포넌트를 분리하지 않는다.
- 공통화는 실제 중복과 재사용 가능성이 명확할 때 적용한다.
- 명시적인 로직을 지나치게 추상화된 구현보다 우선한다.
- 사용하지 않는 import, 변수, 로그, 임시 주석을 남기지 않는다.
- JavaScript 파일을 요청 없이 한꺼번에 TypeScript로 변환하지 않는다.
- TypeScript에서 `any` 사용을 피한다.
- 외부 API와 Firestore 데이터는 유효하지 않을 수 있다고 가정한다.
- 로딩, 빈 상태, 오류 상태를 확인한다.
- 모바일, 태블릿, 데스크톱 반응형 레이아웃을 확인한다.
- 접근성과 키보드 사용성을 확인한다.

## React rules

- Hook을 조건부로 호출하지 않는다.
- `useEffect`, `useMemo`, `useCallback`의 의존성을 확인한다.
- 같은 상태를 여러 컴포넌트나 Context에 중복 저장하지 않는다.
- 불필요한 리렌더링을 줄이되 근거 없는 메모이제이션은 추가하지 않는다.
- 컴포넌트는 역할이 명확한 범위에서 유지한다.
- Props와 이벤트 이름은 역할이 드러나도록 작성한다.

## API and security rules

- 비밀로 유지해야 하는 값을 `VITE_` 환경 변수에 저장하지 않는다.
- API 키, 토큰, `.env` 파일을 커밋하지 않는다.
- 외부 API 응답 구조를 신뢰하지 않고 필요한 값을 검증한다.

## Validation commands

변경 후 가능한 범위에서 다음 명령을 실행한다.

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`

실행하지 못한 명령이나 확인하지 못한 부분은 결과에 명시한다.

경고를 숨기거나 검사 규칙을 완화해서 검증을 통과시키지 않는다.

현재 알려진 기존 경고:

- React Hook 의존성 관련 ESLint 경고
- Vite 번들 크기 경고

이번 변경으로 새로 발생하거나 증가하지 않았다면 기존 경고를 새로운 회귀로 보고하지 않는다.

## Review guidelines

Pull Request에서는 해당 PR이 추가한 변경만 검토한다.

다음 항목을 우선 확인한다.

- 런타임 오류와 기존 기능 회귀
- React Hook 호출 규칙
- 누락되거나 오래된 Hook 의존성
- 상태 중복과 상태 동기화 문제
- TypeScript 타입 안정성
- SoundCloud Widget 이벤트와 트랙 데이터 처리
- Firebase 인증과 Firestore 데이터 처리
- 로딩, 빈 상태, 오류 상태
- 오디오 재생과 재생목록 상태
- 모바일 반응형 레이아웃
- 폼 및 키보드 접근성
- 브라우저에 노출되는 비밀정보
- 구현과 README의 불일치

각 지적에는 다음 내용을 포함한다.

- 파일 경로와 관련 코드 위치
- 문제가 되는 이유
- 재현되거나 발생하는 조건
- 수정 방향

코드 스타일 취향, 사소한 표현, 근거 없는 리팩터링 제안은 지적하지 않는다.

실행 가능한 문제가 없다면 명확하게 문제가 없다고 작성한다.

## Portfolio guidelines

이 프로젝트는 한국 주니어 프론트엔드 및 웹 퍼블리셔 취업용 포트폴리오다.

다음 역량이 명확하게 드러나도록 유지한다.

- 반응형 UI 구현
- 시맨틱 HTML
- 키보드 접근성
- React 상태 관리
- 외부 API 연동
- 비밀키 보호
- 실제 배포 경험
- 유지보수 가능한 코드 구조

구현되지 않은 기능, 확인되지 않은 성능 수치, 과장된 개선 효과를 작성하지 않는다.

## Documentation rules

기능, 실행 방법, 기술 스택, 폴더 구조 또는 배포 방식이 변경되면 `README.md`를 확인한다.

README에는 실제 코드로 확인되는 내용만 작성한다.

다음 항목이 변경되었는지 확인한다.

- 주요 기능
- 기술 스택
- 폴더 구조
- 설치 및 실행 명령
- 환경 변수
- Cloudflare 프론트엔드 배포 설정
- 배포 방법
- 향후 개선 사항
