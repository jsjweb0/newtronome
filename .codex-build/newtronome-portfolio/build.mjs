import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "/Users/jeongsujin/Projects/newtronome";
const buildDir = path.join(workspaceDir, ".codex-build/newtronome-portfolio");
const outputDir = path.join(workspaceDir, "output/pptx");
const skillDir = "/Users/jeongsujin/.codex/plugins/cache/openai-primary-runtime/presentations/26.1013.11914/skills/presentations";
const runtimePython = "/Users/jeongsujin/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const finalPath = path.join(outputDir, "newtronome-portfolio-3pages-final.pptx");
const fontFamily = "Apple SD Gothic Neo";

const C = {
  bg: "#F7F6F2",
  ink: "#141517",
  navy: "#173F6B",
  coral: "#FF665C",
  muted: "#777C84",
  line: "#D8D6D0",
  paleBlue: "#E8EEFF",
  blueLine: "#CAD7FF",
  paleCoral: "#FFE0DA",
  light: "#EFEFED",
  white: "#FFFFFF",
  black: "#0B0B0C",
};

const S = 2 / 3;
const W = 1280;
const H = 720;

async function bytes(file) {
  const data = await fs.readFile(file);
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

function shape(slide, geometry, left, top, width, height, fill = "none", lineFill = "none", lineWidth = 0, radius) {
  return slide.shapes.add({
    geometry,
    position: { left: left * S, top: top * S, width: width * S, height: height * S },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth * S },
    ...(radius ? { borderRadius: radius } : {}),
  });
}

function text(slide, value, left, top, width, height, options = {}) {
  const box = shape(slide, "textbox", left, top, width, height);
  box.text = value;
  box.text.style = {
    typeface: fontFamily,
    fontSize: (options.fontSize ?? 24) * S,
    bold: options.bold ?? false,
    color: options.color ?? C.ink,
    ...(options.italic ? { italic: true } : {}),
  };
  box.text.paragraphFormat = {
    alignment: options.align ?? "left",
    verticalAlignment: options.vAlign ?? "middle",
    ...(options.lineSpacing ? { lineSpacing: options.lineSpacing } : {}),
  };
  return box;
}

function line(slide, left, top, width, height = 0, color = C.line, lineWidth = 2) {
  return shape(slide, "line", left, top, width, height, "none", color, lineWidth);
}

function browserFrame(slide, imageBlob, left, top, width, height, alt) {
  shape(slide, "roundRect", left, top, width, height, C.black, C.black, 1, "rounded-2xl");
  shape(slide, "ellipse", left + 22, top + 18, 12, 12, C.coral);
  shape(slide, "ellipse", left + 43, top + 18, 12, 12, "#F2C45C");
  shape(slide, "ellipse", left + 64, top + 18, 12, 12, "#61C3A0");
  slide.images.add({
    blob: imageBlob,
    contentType: alt.endsWith("mobile") ? "image/jpeg" : "image/png",
    alt,
    fit: "contain",
    position: { left: (left + 15) * S, top: (top + 48) * S, width: (width - 30) * S, height: (height - 63) * S },
    geometry: "roundRect",
    borderRadius: "rounded-xl",
  });
}

function footer(slide, page) {
  text(slide, "NEWTRONOME  ·  2025. 08 - 진행 중", 84, 1018, 520, 24, { fontSize: 16, color: C.muted });
  text(slide, `${page} / 9`, 1770, 1018, 70, 24, { fontSize: 16, color: C.muted, align: "right" });
}

function topNav(slide, label) {
  text(slide, "●", 78, 55, 28, 38, { fontSize: 15, bold: true, color: C.navy, align: "center" });
  text(slide, label, 112, 60, 320, 38, { fontSize: 17, bold: true, color: C.navy });
  text(slide, "Demo ↗", 1640, 60, 90, 38, { fontSize: 17, bold: true, color: C.navy, align: "right" });
  text(slide, "GitHub ↗", 1750, 60, 100, 38, { fontSize: 17, bold: true, color: C.navy, align: "right" });
}

function pill(slide, label, left, top, width, fill, color = C.navy) {
  shape(slide, "roundRect", left, top, width, 64, fill, "none", 0, "rounded-full");
  text(slide, label, left + 16, top + 7, width - 32, 50, { fontSize: 21, bold: true, color, align: "center" });
}

function flowBox(slide, label, left, top, width, fill, color = C.navy) {
  shape(slide, "roundRect", left, top, width, 102, fill, fill === C.navy ? C.navy : C.blueLine, 1, "rounded-xl");
  text(slide, label, left + 18, top + 13, width - 36, 76, { fontSize: 22, bold: true, color: fill === C.navy ? C.white : color, align: "center" });
}

async function main() {
  await fs.mkdir(buildDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  const desktop = await bytes(path.join(workspaceDir, "docs/images/newtronome-playlist-desktop.png"));
  const mobile = await bytes(path.join(workspaceDir, "docs/images/newtronome-playlist-mobile.jpg"));

  const deck = Presentation.create({ slideSize: { width: W, height: H } });
  deck.theme.defaultFont = fontFamily;

  // 6P — overview
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    topNav(s, "PROJECT OVERVIEW");
    text(s, "MUSIC DISCOVERY", 84, 176, 400, 34, { fontSize: 21, bold: true, color: C.coral });
    text(s, "NEWTRONOME", 84, 213, 750, 96, { fontSize: 70, bold: true });
    text(s, "외부 음악 연동과 상태 관리 구조를\n개선한 음악 서비스", 84, 350, 720, 92, { fontSize: 31, bold: true });
    text(s,
      "SoundCloud 플레이리스트 재생, iTunes 음악 검색,\n사용자별 트랙 저장과 커뮤니티 기능을 구현했습니다.\n기능 확장 과정에서 재생 상태와 서버 상태 구조를 리팩터링했습니다.",
      84, 470, 720, 125, { fontSize: 21, color: C.muted });
    line(s, 84, 625, 720, 0, C.line, 2);
    text(s, "React / TypeScript / TanStack Query / Zustand / Firebase / Vitest", 84, 646, 730, 34, { fontSize: 18, color: C.muted });

    browserFrame(s, desktop, 910, 160, 870, 530, "Newtronome desktop playlist screen");

    pill(s, "비공식 API·프록시", 84, 748, 290, C.light);
    text(s, "→", 376, 758, 50, 42, { fontSize: 28, bold: true, color: "#5278FF", align: "center" });
    pill(s, "공식 SoundCloud Widget", 430, 748, 360, C.navy, C.white);
    pill(s, "Context API 재생 상태", 84, 832, 290, C.light);
    text(s, "→", 376, 842, 50, 42, { fontSize: 28, bold: true, color: "#5278FF", align: "center" });
    pill(s, "Zustand 선택적 구독", 430, 832, 360, C.navy, C.white);

    pill(s, "Playlist · 연속 재생", 920, 748, 400, C.paleCoral, C.coral);
    pill(s, "Likes · 단일 재생", 1350, 748, 400, C.paleBlue, C.navy);
    pill(s, "검색 · 아티스트 곡 탐색", 920, 832, 400, C.paleBlue, C.navy);
    pill(s, "반응형 · 키보드 접근", 1350, 832, 400, C.paleCoral, C.coral);
    footer(s, 6);
  }

  // 7P — board server state refactor
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    topNav(s, "STATE MANAGEMENT");
    text(s, "직접 관리하던 게시판 캐시를\nTanStack Query로 전환", 84, 145, 1100, 125, { fontSize: 48, bold: true });
    text(s, "Firestore 접근과 UI 상태의 책임을 분리하고, 변경 범위에 맞춰 캐시를 갱신했습니다.", 84, 282, 1250, 45, { fontSize: 24, color: C.muted });

    line(s, 90, 366, 0, 142, C.coral, 5);
    text(s, "문제", 108, 354, 100, 28, { fontSize: 16, bold: true, color: C.coral });
    text(s, "PostsProvider가 데이터 접근과\n수동 캐시를 함께 관리", 108, 386, 690, 70, { fontSize: 25, bold: true, color: C.coral });
    text(s, "기능이 늘면서 캐시 갱신 범위가 복잡해지고,\n늦게 끝난 요청이 다른 화면을 바꿀 가능성이 생겼습니다.", 108, 463, 720, 66, { fontSize: 19, color: C.muted });

    line(s, 1015, 366, 0, 142, C.navy, 5);
    text(s, "해결", 1033, 354, 100, 28, { fontSize: 16, bold: true, color: C.navy });
    text(s, "Firestore Service와 Query Hook으로\n데이터 흐름을 분리", 1033, 386, 710, 70, { fontSize: 25, bold: true, color: C.navy });
    text(s, "게시판 종류·게시글 ID·사용자 ID로 Query Key를 나누고,\n변경과 관련된 Query만 갱신했습니다.", 1033, 463, 730, 66, { fontSize: 19, color: C.muted });

    flowBox(s, "PostsProvider\nuseRef 직접 캐시", 220, 590, 350, C.paleBlue);
    text(s, "→", 584, 618, 48, 44, { fontSize: 30, bold: true, color: "#5278FF", align: "center" });
    flowBox(s, "Firestore Service\n접근 책임 분리", 650, 590, 350, C.paleBlue);
    text(s, "→", 1014, 618, 48, 44, { fontSize: 30, bold: true, color: "#5278FF", align: "center" });
    flowBox(s, "TanStack Query\nQuery Key·Mutation", 1080, 590, 390, C.navy);

    text(s, "실제 처리", 150, 761, 130, 34, { fontSize: 18, bold: true, color: C.navy });
    text(s, "A 게시글의 늦은 조회수 응답은 A 캐시만 갱신하고, 사용자가 이동한 B 게시글에는 영향을 주지 않습니다.", 280, 755, 1450, 48, { fontSize: 22, bold: true });
    line(s, 84, 827, 1750, 0, C.line, 2);
    text(s, "결과", 108, 854, 100, 40, { fontSize: 22, bold: true, color: C.navy });
    text(s, "PostsContext를 제거하고 서버 상태와 입력 상태를 분리했습니다. 백그라운드 재조회 중에도 작성 중인 입력값을 유지하고, 중복 삭제와 늦은 응답을 브라우저 테스트로 확인했습니다.", 230, 846, 1530, 68, { fontSize: 23, bold: true });
    footer(s, 7);
  }

  // 8P — async search and playback conflict
  {
    const s = deck.slides.add();
    s.background.fill = C.bg;
    topNav(s, "ASYNC & PLAYBACK");
    text(s, "비동기 검색과 오디오 재생 충돌 처리", 84, 145, 1200, 70, { fontSize: 49, bold: true });
    text(s, "이전 검색과 재생 요청이 늦게 완료되어도 최신 선택만 화면과 재생 상태에 반영했습니다.", 84, 231, 1420, 45, { fontSize: 24, color: C.muted });

    browserFrame(s, mobile, 84, 332, 860, 560, "Newtronome mobile search screen mobile");

    text(s, "문제", 1015, 332, 95, 30, { fontSize: 18, bold: true, color: C.coral });
    text(s, "연속 검색과 미리듣기의 경쟁 상태", 1015, 370, 700, 50, { fontSize: 30, bold: true, color: C.navy });
    text(s, "검색어나 곡을 빠르게 변경하면 이전 요청이 나중에 완료되어\n현재 검색 결과나 재생 상태를 덮어쓸 수 있었습니다.", 1015, 428, 730, 72, { fontSize: 20, color: C.muted });
    line(s, 1015, 525, 740, 0, C.line, 2);

    text(s, "검색", 1028, 550, 100, 34, { fontSize: 22, bold: true, color: C.navy });
    flowBox(s, "요청 취소\nAbortSignal", 1015, 595, 220, C.paleBlue);
    text(s, "→", 1243, 625, 38, 40, { fontSize: 26, bold: true, color: "#5278FF", align: "center" });
    flowBox(s, "응답 검증\nType Guard", 1290, 595, 220, C.paleBlue);
    text(s, "→", 1518, 625, 38, 40, { fontSize: 26, bold: true, color: "#5278FF", align: "center" });
    flowBox(s, "유효한 트랙\n표시", 1565, 595, 220, C.navy);

    text(s, "재생", 1028, 725, 100, 34, { fontSize: 22, bold: true, color: C.navy });
    flowBox(s, "요청 번호 생성", 1015, 770, 250, C.paleBlue);
    text(s, "→", 1273, 800, 38, 40, { fontSize: 26, bold: true, color: "#5278FF", align: "center" });
    flowBox(s, "최신 요청 확인", 1320, 770, 250, C.paleBlue);
    text(s, "→", 1578, 800, 38, 40, { fontSize: 26, bold: true, color: "#5278FF", align: "center" });
    flowBox(s, "현재 상태 반영", 1625, 770, 190, C.navy);

    text(s, "iTunes 미리듣기와 SoundCloud 재생은 서로 시작될 때 기존 오디오를 정지합니다.", 1015, 900, 800, 44, { fontSize: 21, bold: true, color: C.navy });
    footer(s, 8);
  }

  for (const [i, slide] of deck.slides.items.entries()) {
    const png = await deck.export({ slide, format: "png", scale: 1 });
    await fs.writeFile(path.join(buildDir, `slide-${i + 1}.png`), new Uint8Array(await png.arrayBuffer()));
  }
  const montage = await deck.export({ format: "webp", montage: true });
  await fs.writeFile(path.join(buildDir, "montage.webp"), new Uint8Array(await montage.arrayBuffer()));

  const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, "container_tools/artifact_tool_utils.mjs")).href);
  const stagingDir = path.join(buildDir, ".finalizer");
  await fs.mkdir(stagingDir, { recursive: true });
  const candidatePath = path.join(stagingDir, "candidate.pptx");
  await (await PresentationFile.exportPptx(deck)).save(candidatePath);
  await finalizePresentation({
    explicitTotalSlideCount: 3,
    requiredNativeTableOwnerSlides: [],
    requiredNativeChartOwnerSlides: [],
    workspaceDir,
    candidatePath,
    finalPath,
    pythonExecutable: runtimePython,
    integrityValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_package_integrity.py"),
    layoutValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_layout_geometry.py"),
    layoutArgs: [
      "--expected-slide-size-emu", "12192000,6858000",
      "--validate-heading-fit",
    ],
    fontPolicy: { basis: "design", families: [fontFamily] },
    verifyArtifactToolImport: true,
    receiptPath: path.join(stagingDir, "validation-final.json"),
  });
  console.log(finalPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
