# 의존성 보안 1차 업데이트와 테스트 경고 정리

검증일: 2026-11-12. 기준 main: `6c8054b95709c9400a27e60da46fce6c2ce6a3c8`.

## 변경 범위

- React Router 7.x와 Vite 6.x의 수정 버전을 적용했다.
- 부모 패키지의 기존 버전 범위 내에서 보안 수정 전이 의존성을 갱신했다.
- Vitest 3.2.4, Firebase CLI 15.30.2, Firebase SDK 11.10.0은 유지했다.
- `overrides`, force, audit 설정 완화는 사용하지 않았다. 제품 코드는 변경하지 않았다.
- main의 두 미커밋 테스트 변경을 함께 포함했다. 원래 작업 폴더의 변경은 보존했다.
- 임시 worktree가 삭제되어 패키지 변경을 다시 구성한 뒤 검증을 재실행했다.
- README의 기술 스택·설치·배포 방법은 여전히 유효하므로 수정하지 않았다.

## audit 결과

| 구분 | Critical | High | Moderate | Low | 합계 |
|---|---:|---:|---:|---:|---:|
| main lockfile | 3 | 19 | 27 | 2 | 51 |
| 업데이트 후 전체 | 2 | 10 | 21 | 0 | 33 |
| 업데이트 후 운영 경로 | 0 | 4 | 0 | 0 | 4 |

이전 11월 11일 실행 기록의 묶음별 전체 집계는 51 → 49(Router) → 45(Vite/CSS) → 33(나머지 전이 의존성)이었다. 당시 운영 경로는 9 → 4였다. 이번 재구성 후 전체 33 및 운영 경로 4를 재확인했다.

audit 숫자는 취약 패키지 집계이며 독립된 보안 결함 개수나 실제 브라우저 악용 가능성 개수와 같지 않다. 최종 audit 종료 코드 1은 잔여 취약점 발견을 의미한다.

## 실제 설치 버전 변경

| lockfile 패키지 위치 | 이전 | 이후 |
|---|---|---|
| node_modules/@babel/code-frame | 7.29.0 | 7.29.7 |
| node_modules/@babel/compat-data | 7.29.0 | 7.29.7 |
| node_modules/@babel/core | 7.29.0 | 7.29.13 |
| node_modules/@babel/generator | 7.29.1 | 7.29.14 |
| node_modules/@babel/helper-compilation-targets | 7.28.6 | 7.29.13 |
| node_modules/@babel/helper-globals | 7.28.0 | 7.29.7 |
| node_modules/@babel/helper-module-imports | 7.28.6 | 7.29.7 |
| node_modules/@babel/helper-module-transforms | 7.28.6 | 7.29.14 |
| node_modules/@babel/helper-string-parser | 7.27.1 | 7.29.14 |
| node_modules/@babel/helper-validator-identifier | 7.28.5 | 7.29.7 |
| node_modules/@babel/helper-validator-option | 7.27.1 | 7.29.7 |
| node_modules/@babel/helpers | 7.29.2 | 7.29.14 |
| node_modules/@babel/parser | 7.29.2 | 7.29.14 |
| node_modules/@babel/template | 7.28.6 | 7.29.7 |
| node_modules/@babel/traverse | 7.29.0 | 7.29.14 |
| node_modules/@babel/types | 7.29.0 | 7.29.14 |
| node_modules/@google-cloud/cloud-sql-connector/node_modules/@grpc/grpc-js | 1.14.5 | 1.14.7 |
| node_modules/@google-cloud/firestore-api/node_modules/@grpc/grpc-js | 1.14.5 | 1.14.7 |
| node_modules/@google-cloud/pubsub/node_modules/@grpc/grpc-js | 1.14.5 | 1.14.7 |
| node_modules/@google-cloud/sql/node_modules/@grpc/grpc-js | 1.14.5 | 1.14.7 |
| node_modules/@grpc/grpc-js | 1.9.15 | 1.9.16 |
| node_modules/@hono/node-server | 2.1.1 | 2.1.7 |
| node_modules/@modelcontextprotocol/sdk | 1.30.0 | 1.32.2 |
| node_modules/@modelcontextprotocol/sdk/node_modules/body-parser | 2.3.0 | 2.4.0 |
| node_modules/@nodable/entities | 3.0.0 | 3.1.0 |
| node_modules/@protobufjs/eventemitter | 1.1.0 | 1.1.1 |
| node_modules/@protobufjs/fetch | 1.1.0 | 1.1.1 |
| node_modules/@typescript-eslint/typescript-estree/node_modules/brace-expansion | 5.0.7 | 5.0.13 |
| node_modules/baseline-browser-mapping | 2.10.23 | 2.11.36 |
| node_modules/body-parser | 1.20.8 | 1.20.9 |
| node_modules/brace-expansion | 1.1.14 | 1.1.22 |
| node_modules/browserslist | 4.28.2 | 4.29.5 |
| node_modules/caniuse-lite | 1.0.30001791 | 1.0.30001826 |
| node_modules/electron-to-chromium | 1.5.344 | 1.5.483 |
| node_modules/fast-uri | 3.1.8 | 3.1.9 |
| node_modules/fast-xml-parser | 5.11.1 | 5.12.0 |
| node_modules/firebase-tools/node_modules/undici | 6.28.1 | 6.29.1 |
| node_modules/glob/node_modules/brace-expansion | 2.1.7 | 2.1.8 |
| node_modules/google-gax/node_modules/@grpc/grpc-js | 1.14.5 | 1.14.7 |
| node_modules/hono | 4.13.8 | 4.13.18 |
| node_modules/ip-address | 10.7.2 | 10.7.6 |
| node_modules/is-unsafe | 2.0.2 | 2.0.3 |
| node_modules/nanoid | 3.3.11 | 3.3.20 |
| node_modules/node-releases | 2.0.38 | 2.0.63 |
| node_modules/postcss | 8.5.12 | 8.5.32 |
| node_modules/protobufjs | 7.5.6 | 7.6.6 |
| node_modules/qs | 6.16.0 | 6.16.2 |
| node_modules/react-router | 7.14.2 | 7.18.5 |
| node_modules/react-router-dom | 7.14.2 | 7.18.5 |
| node_modules/readdir-glob/node_modules/brace-expansion | 2.1.7 | 2.1.8 |
| node_modules/set-cookie-parser | 2.7.2 | 2.7.3 |
| node_modules/source-map-js | 1.2.1 | 1.2.2 |
| node_modules/strnum | 2.4.2 | 2.5.1 |
| node_modules/superstatic/node_modules/brace-expansion | 2.1.7 | 2.1.8 |
| node_modules/undici | 8.10.2 | 8.12.4 |
| node_modules/update-browserslist-db | 1.2.3 | 1.3.4 |
| node_modules/vite | 6.3.5 | 6.4.6 |
| node_modules/websocket-driver | 0.7.4 | 0.7.5 |
| node_modules/zod | 4.6.5 | 4.6.7 |
| node_modules/@protobufjs/inquire | 1.1.1 | 제거: 상위 패키지가 더 이상 요구하지 않음 |

## 해소 및 잔여 항목

현재 audit에서 해소된 22개 패키지 항목:

- `@babel/core`
- `@hono/node-server`
- `@modelcontextprotocol/sdk`
- `baseline-browser-mapping`
- `body-parser`
- `brace-expansion`
- `browserslist`
- `fast-uri`
- `fast-xml-parser`
- `hono`
- `ip-address`
- `nanoid`
- `postcss`
- `protobufjs`
- `qs`
- `react-router`
- `react-router-dom`
- `source-map-js`
- `undici`
- `vite`
- `websocket-driver`
- `zod`

기존 gRPC 권고가 Firebase 상위 패키지 4개에도 집계되어 순감은 18개다. 이 상위 패키지의 버전은 변경하지 않았다. gRPC 1.9.16은 malformed message 권고 2개를 해결하지만 인증서·오류 메시지 관련 권고는 남긴다. 운영 경로 잔여 항목은 gRPC, Firestore, Firestore compat, Firebase다.

| 잔여 패키지 | 등급 | 권고 또는 전파 원인 |
|---|---|---|
| @firebase/firestore | high | @grpc/grpc-js |
| @firebase/firestore-compat | high | @firebase/firestore |
| @firebase/rules-unit-testing | high | firebase |
| @google-cloud/pubsub | moderate | @opentelemetry/core |
| @grpc/grpc-js | high | [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j), [GHSA-f596-whhp-79r4](https://github.com/advisories/GHSA-f596-whhp-79r4) |
| @opentelemetry/core | moderate | [GHSA-8988-4f7v-96qf](https://github.com/advisories/GHSA-8988-4f7v-96qf) |
| @typescript-eslint/eslint-plugin | moderate | @typescript-eslint/type-utils, @typescript-eslint/utils |
| @typescript-eslint/parser | moderate | @typescript-eslint/typescript-estree |
| @typescript-eslint/type-utils | moderate | @typescript-eslint/typescript-estree, @typescript-eslint/utils |
| @typescript-eslint/typescript-estree | moderate | minimatch |
| @typescript-eslint/utils | moderate | @typescript-eslint/typescript-estree |
| @vitest/mocker | moderate | [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), [GHSA-qxg6-89mg-rqv8](https://github.com/advisories/GHSA-qxg6-89mg-rqv8) |
| archiver | moderate | archiver-utils, zip-stream |
| archiver-utils | moderate | glob |
| basic-ftp | high | [GHSA-c475-qrg2-pj4r](https://github.com/advisories/GHSA-c475-qrg2-pj4r) |
| csv-parse | moderate | [GHSA-8cw4-87c7-c6xx](https://github.com/advisories/GHSA-8cw4-87c7-c6xx) |
| exegesis | moderate | glob |
| firebase | high | @firebase/firestore, @firebase/firestore-compat |
| firebase-tools | high | @google-cloud/pubsub, archiver, csv-parse, exegesis, gaxios, glob, proxy-agent, stream-json |
| gaxios | moderate | uuid |
| get-uri | high | basic-ftp |
| glob | moderate | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), minimatch |
| google-gax | moderate | rimraf |
| minimatch | moderate | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| pac-proxy-agent | high | get-uri |
| proxy-agent | high | pac-proxy-agent |
| rimraf | moderate | glob |
| stream-json | moderate | [GHSA-528h-pc64-c93x](https://github.com/advisories/GHSA-528h-pc64-c93x), [GHSA-hqr4-qq8f-hg3x](https://github.com/advisories/GHSA-hqr4-qq8f-hg3x), [GHSA-mjw6-4jj6-33hc](https://github.com/advisories/GHSA-mjw6-4jj6-33hc) |
| tinypool | critical | [GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3), [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr) |
| typescript-eslint | moderate | @typescript-eslint/eslint-plugin, @typescript-eslint/parser, @typescript-eslint/typescript-estree, @typescript-eslint/utils |
| uuid | moderate | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) |
| vitest | critical | @vitest/mocker, [GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp), [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), tinypool |
| zip-stream | moderate | archiver-utils |

## 테스트 경고 정리

- `MainLayout.test.tsx`: Testing Library의 `act` 사용, Zustand 상태 변경을 `act`로 감싸기, 잘못된 URL의 예상 Router 경고를 별도 검증. 예상 경고만 처리하고 다른 경고는 그대로 출력한다.
- `ITunesSearchPage.test.tsx`: CSS 애니메이션을 실행하지 않는 jsdom 환경을 반영해 `getAnimations()`가 빈 배열을 반환하도록 mock한다.
- 최종 단위 테스트 로그에서 stderr 및 경고가 확인되지 않았다. 테스트 수는 364개로 유지된다.

## 검증 결과

macOS / Node 24.22.1 / npm 11.19.1에서 검증했다.

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm run test:run` | 46개 파일, 364개 테스트 통과 |
| `npm run build` | 통과. 기존 500 kB 초과 청크 경고 유지 |
| `npm run test:e2e` | 30개 통과: 재생 12, 게시판 13, 접근성 5 |
| `npm run test:rules` | 로컬 에뮬레이터에서 45개 통과 |
| `npm audit --json` | 잔여 33개 |
| `npm audit --omit=dev --json` | 잔여 4개 |

단위 테스트 수정은 제품과 E2E 실행 경로에 영향을 주지 않는다. 최종 타입·lint·단위 테스트·빌드는 두 테스트 수정을 포함해 재실행했다. 접근성은 전체 Playwright 실행의 a11y-chromium 프로젝트로 검증했다. Firestore 거부 기대 테스트의 PERMISSION_DENIED 로그는 통과 결과와 함께 발생한다.

## 남은 확인과 2차 권장 작업

직접 의존성의 메이저 변경은 없다. 기존 부모 범위 내 갱신이지만 모든 환경의 런타임 호환성을 보장하는 것은 아니다.

- PR의 CI Node 22 실행 결과를 확인한다.
- SoundCloud 재생 검증은 Mock 기반이다. 실제 재생·일시정지 위치 유지·자연 종료 전환·모바일 자동재생은 별도 확인이 필요하다.
- 실제 Firebase 로그인과 배포는 수행하지 않았다.
- Vitest 4 전환으로 mocker/Tinypool 경로를 별도 처리한다.
- Firebase CLI 업데이트와 glob/minimatch, OpenTelemetry, basic-ftp, uuid의 부모 범위 제약은 후속 작업에서 검토한다. 검증 없이 overrides나 다운그레이드를 적용하지 않는다.
