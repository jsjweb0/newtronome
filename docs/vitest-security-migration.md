# Vitest 4 보안 전환

검증일: 2026-11-12. 기준 main: `ee4c0aa`.

## 변경 범위

- `vitest`를 3.2.4에서 4.1.12로 전환하고 연결된 `@vitest/*` 패키지를 갱신했다.
- Vitest 4의 실행 pool 변경으로 `tinypool`이 제거됐다. `vite-node`도 더 이상 설치되지 않는다.
- Vite 6.4.6, Firebase SDK 11.10.0, Firebase CLI 15.30.2는 유지했다.
- 제품 코드, 테스트 기대값, 테스트 설정은 변경하지 않았다. force, overrides, audit 검사 완화는 사용하지 않았다.
- README의 기술 스택·실행 명령·배포 방법은 여전히 유효하여 수정하지 않았다.

## 버전 선택과 호환성 검토

조회 시점 Vitest 4 계열의 최신 버전은 4.1.12였다. npm 메타데이터의 Node 요구 범위는 `^20.0.0 || ^22.0.0 || >=24.0.0`, Vite 범위는 `^6.0.0 || ^7.0.0 || ^8.0.0`이므로 프로젝트의 Vite 6.4.6과 CI Node 22가 요구 범위에 들어간다.

- [Vitest 4 마이그레이션 안내](https://v4.vitest.dev/guide/migration.html): pool 재작성과 Tinypool 제거, mock/spy 동작 변경을 확인했다. 현재 설정에는 제거된 poolOptions 옵션이 없다.
- [Redirect mock 파일 읽기 권고](https://github.com/advisories/GHSA-82fw-gwwq-j7x9): 4.1.11에서 수정됐다.
- [수동 mock 등록 코드 주입 권고](https://github.com/advisories/GHSA-qxg6-89mg-rqv8): 4.1.12에서 수정됐다.

연결된 Chai, std-env, tinyexec 등도 Vitest 4가 요구하는 범위로 갱신됐다. 메이저 변경으로 mock 복원과 worker 동작이 달라질 수 있지만 기존 테스트가 수정 없이 통과했다. 이는 검증한 실행 경로의 결과이며 모든 환경에서의 동작을 보장하지 않는다.

## audit 전후

| 구분 | Critical | High | Moderate | Low | 합계 |
|---|---:|---:|---:|---:|---:|
| 변경 전 전체 | 2 | 10 | 21 | 0 | 33 |
| 변경 후 전체 | 0 | 10 | 20 | 0 | 30 |
| 변경 후 운영 의존성 경로 | 0 | 4 | 0 | 0 | 4 |

현재 audit에서 `vitest`, `@vitest/mocker`, `tinypool` 항목이 해소됐고 새로 추가된 취약 패키지 항목은 없다. lockfile에 Tinypool이 없는 것도 확인했다. 잔여 항목은 Firebase/gRPC, Firebase CLI 전이 의존성 및 lint 도구 등의 후속 검토 범위다.

audit의 종료 코드 1은 잔여 취약점 발견을 뜻하며 조회 실패와 구별한다. 운영 의존성 경로 집계는 실제 브라우저 악용 가능성 개수와 같지 않다.

## 검증

macOS / Node 24.22.1 / npm 11.19.1에서 실행했다.

| 명령 | 결과 |
|---|---|
| 전환 전 `npm run test:run` | 46개 파일, 364개 통과 |
| 전환 후 `npm run test:run` | 46개 파일, 364개 통과, 경고 없음 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm run build` | 통과, 기존 500 kB 초과 청크 경고 유지 |
| `npm run test:rules` | 로컬 Firestore 에뮬레이터에서 45개 통과 |
| `npm run test:e2e` | 재생 데스크톱·모바일 12개, 게시판 13개, 접근성 5개로 총 30개 통과 |
| `npm ls --all --json` | 통과 |
| `git diff --check` | 통과 |
| `npm audit --json` | 잔여 30개 |
| `npm audit --omit=dev --json` | 잔여 4개 |

기존 재생 테스트에서 사용자 조작, Widget 이벤트/콜백, Zustand 상태 변화 순서를 검증한다. 일시정지·재개 시 위치 유지, 불필요한 load/skip/seek 방지, 요청별 오류 보고, 늦은 응답 경합 검증의 기대값을 그대로 유지했다.

## 남은 확인

- CI Node 22 환경의 실제 실행은 별도 확인이 필요하다.
- 재생 단위 테스트와 E2E는 SoundCloud Mock 기반이다. 실제 재생, 일시정지 후 위치 유지, 자연 종료 전환, 모바일 자동재생 제한은 별도 확인이 필요하다.
- 실제 Firebase 로그인 및 운영 배포는 수행하지 않았다.
- 다음 보안 작업은 Firebase CLI 업데이트와 부모 패키지 버전 제약 검토다.
