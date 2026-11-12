# Firebase CLI 보안 업데이트

검증일: 2026-11-12. 기준 main: 3547b61 (PR #91 병합).

## 변경 범위

- firebase-tools 15.30.2 → 15.36.0. 현재 조회한 최신 안정 15.x 버전이다.
- CLI의 CSV·JSON 스트림·파일 감시 관련 전이 의존성이 부모 요구 범위에 따라 갱신됐다.
- 기존 CLI가 요구하던 FTP·PAC 프록시 계열 경로가 제거됐다.
- Firebase SDK 11.10.0, firebase-admin 14.4.0, Vitest 4.1.12, Vite 6.4.6 및 제품 코드·테스트·Firestore 규칙은 변경하지 않았다.
- force, overrides, audit 기준 완화는 사용하지 않았다.
- README의 기술 스택·실행·배포 안내는 여전히 유효하므로 수정하지 않았다.

## 실제 버전 변경

| 패키지 위치 | 이전 | 이후 |
|---|---|---|
| node_modules/chokidar | 3.6.0 | 4.0.3 |
| node_modules/csv-parse | 5.6.0 | 7.0.3 |
| node_modules/firebase-tools | 15.30.2 | 15.36.0 |
| node_modules/readdirp | 3.6.0 | 4.1.2 |
| node_modules/stream-chain | 2.2.5 | 4.4.2 |
| node_modules/stream-json | 1.9.1 | 3.9.0 |

제거된 설치 경로:

- `node_modules/@apphosting/common`
- `node_modules/@tootallnate/quickjs-emscripten`
- `node_modules/anymatch`
- `node_modules/anymatch/node_modules/picomatch`
- `node_modules/ast-types`
- `node_modules/basic-ftp`
- `node_modules/binary-extensions`
- `node_modules/braces`
- `node_modules/chokidar/node_modules/glob-parent`
- `node_modules/degenerator`
- `node_modules/escodegen`
- `node_modules/esprima`
- `node_modules/fill-range`
- `node_modules/firebase-tools/node_modules/mime`
- `node_modules/get-uri`
- `node_modules/get-uri/node_modules/data-uri-to-buffer`
- `node_modules/is-binary-path`
- `node_modules/is-number`
- `node_modules/netmask`
- `node_modules/pac-proxy-agent`
- `node_modules/pac-resolver`
- `node_modules/proxy-agent`
- `node_modules/proxy-agent/node_modules/lru-cache`
- `node_modules/proxy-from-env`
- `node_modules/readdirp/node_modules/picomatch`
- `node_modules/smart-buffer`
- `node_modules/socks`
- `node_modules/socks-proxy-agent`
- `node_modules/source-map`
- `node_modules/to-regex-range`
- `node_modules/universal-analytics`
- `node_modules/universal-analytics/node_modules/uuid`

## 보안 결과

| 시점 | Critical | High | Moderate | Low | 합계 |
|---|---:|---:|---:|---:|---:|
| 변경 전 전체 | 0 | 10 | 20 | 0 | 30 |
| 변경 후 전체 | 0 | 5 | 19 | 0 | 24 |
| 변경 후 운영 경로 | 0 | 4 | 0 | 0 | 4 |

해소된 항목: `csv-parse`, `stream-json`, `basic-ftp`, `get-uri`, `pac-proxy-agent`, `proxy-agent`. 새로 추가된 취약 패키지 항목은 없다. 운영 경로는 기존 4개로 유지된다. audit 종료 코드 1은 잔여 취약점 발견 결과다.

| 잔여 패키지 | 등급 | 원인 권고 또는 전파 경로 |
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
| archiver | moderate | archiver-utils, zip-stream |
| archiver-utils | moderate | glob |
| exegesis | moderate | glob |
| firebase | high | @firebase/firestore, @firebase/firestore-compat |
| firebase-tools | moderate | @google-cloud/pubsub, archiver, exegesis, gaxios, glob |
| gaxios | moderate | uuid |
| glob | moderate | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), minimatch |
| google-gax | moderate | rimraf |
| minimatch | moderate | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) |
| rimraf | moderate | glob |
| typescript-eslint | moderate | @typescript-eslint/eslint-plugin, @typescript-eslint/parser, @typescript-eslint/typescript-estree, @typescript-eslint/utils |
| uuid | moderate | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) |
| zip-stream | moderate | archiver-utils |

## 호환성 검토

- [공식 15.36.0 릴리스](https://github.com/firebase/firebase-tools/releases/tag/v15.36.0)에서 Firestore 규칙 reload/HTTP handler 오류 관련 에뮬레이터 crash 수정 등을 확인했다.
- npm 메타데이터의 CLI Node 요구 조건은 Node 20 이상을 포함하며 CI Node 22와 로컬 Node 24가 범위에 들어간다.
- CLI는 같은 메이저지만 csv-parse 5→7, stream-json 1→3, stream-chain 2→4, chokidar 3→4의 하위 메이저 변경이 있어 실제 사용 명령인 emulators:exec를 전후 검증했다.
- glob ^10.5.0, gaxios ^6.7.0, archiver ^7.0.0, PubSub ^5.2.0 제약은 여전히 남는다. 수정 하위 메이저를 강제하지 않았다.

## 검증

macOS / Node 24.22.1 / npm 11.19.1 환경이다.

| 명령 | 결과 |
|---|---|
| 변경 전 npm run test:rules | 45개 통과 |
| 변경 후 npm run test:rules | 45개 통과, 에뮬레이터 시작·정상 종료 확인 |
| npm run typecheck | 통과 |
| npm run lint | 통과 |
| npm run test:run | 46개 파일, 364개 통과 |
| npm run build | 통과, 기존 500 kB 초과 청크 경고 유지 |
| npm run test:e2e | 재생 12개·게시판 13개·접근성 5개, 총 30개 통과 |
| npm ls --all --json | 통과 |
| git diff --check | 통과 |
| npm audit --json | 잔여 24개 |
| npm audit --omit=dev --json | 잔여 4개 |

Firestore의 PERMISSION_DENIED 로그는 거부를 기대하는 규칙 테스트에서 발생하며 테스트는 모두 통과했다.

## 남은 확인

- CI Node 22에서의 실제 실행은 별도 확인이 필요하다.
- 실제 Firebase 로그인, CLI의 데이터 import/export·Hosting·MCP·운영 배포는 수행하지 않았다. 이번 검증 범위는 프로젝트가 사용하는 로컬 Firestore 규칙 테스트다.
- 재생 자동 검증은 SoundCloud Mock 기반이며 실제 재생·모바일 자동재생은 별도 확인이 필요하다.
- 다음 검토 대상은 gRPC/Firebase와 glob/minimatch, OpenTelemetry, uuid의 부모 버전 제약이다.
