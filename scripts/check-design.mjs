#!/usr/bin/env node
// 디자인 시스템 규칙의 결정적 검사기 (기계적으로 검사 가능한 규칙만).
// 사용:
//   node scripts/check-design.mjs <file...>   # 지정 파일 검사 (lint-staged/CLI)
//   node scripts/check-design.mjs --hook       # stdin 훅 JSON에서 file_path 추출해 검사 (Claude PostToolUse)
//   node scripts/check-design.mjs              # 인자 없으면 src/ 전체 워크 (수동/CI, `npm run lint:design`)
// 위반 시 메시지 출력 후 exit 2 (lint-staged=커밋 실패, Claude 훅=blocking). 클린이면 exit 0.
// 규칙 근거: docs/design/do-dont.md. 미적·토큰선택 적절성은 코드로 판정 불가 → 모델+리뷰 영역.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const COLOR_PREFIX = 'bg|text|border|ring|fill|stroke|from|via|to|divide|caret|accent|decoration|outline';

const RE_RAW_PALETTE = new RegExp(`\\b(?:${COLOR_PREFIX})-(?:${PALETTE})-\\d{2,3}\\b`, 'g');
const RE_ARBITRARY_COLOR = new RegExp(`\\b(?:${COLOR_PREFIX})-\\[(?:#|rgba?\\(|hsla?\\()`, 'gi');
const RE_INLINE_COLOR = /style=\{\{[^}]*(?:#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\()/g;

const ALIASES = ['background', 'card', 'foreground', 'muted', 'muted-foreground', 'border', 'destructive'];

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

function scan(content, re, file, label, violations) {
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(content))) {
    violations.push({ file, line: lineOf(content, m.index), msg: `${label} (\`${m[0].slice(0, 48)}\`)` });
  }
}

function checkTsx(file, content, violations) {
  scan(content, RE_RAW_PALETTE, file, 'raw 팔레트 색 클래스 금지 — @theme 토큰 사용', violations);
  scan(content, RE_ARBITRARY_COLOR, file, '임의 색값(bg-[#..]) 금지 — @theme 토큰 사용', violations);
  scan(content, RE_INLINE_COLOR, file, '인라인 style 색상 금지 — @theme 토큰 사용', violations);
}

function checkCss(file, content, violations) {
  const norm = file.replace(/\\/g, '/');
  const isIndex = norm.endsWith('src/index.css') || norm.endsWith('/index.css') || norm === 'index.css';

  // 부정 규칙 (모든 css)
  scan(
    content,
    /--radius-(?:sm|md|lg|xl|2xl|3xl)\s*:/g,
    file,
    'Tailwind 기본 반경 스케일 오버라이드 금지 — rounded-card/field 또는 매핑표 사용',
    violations,
  );
  scan(content, /Plus Jakarta Sans/g, file, '한글 UI에 금지된 폰트(Plus Jakarta Sans) — Pretendard 유지', violations);
  scan(content, /['"]Inter['"]/g, file, '한글 UI에 금지된 폰트(Inter) — Pretendard 유지', violations);
  scan(content, /--color-background\s*:\s*#faf8ff/gi, file, '--color-background 변경 금지(이름 충돌) — surface 사용', violations);

  // 긍정 규칙 (index.css만)
  if (isIndex) {
    for (const name of ALIASES) {
      if (!new RegExp(`--color-${name}\\s*:`).test(content)) {
        violations.push({ file, line: 0, msg: `별칭 토큰 --color-${name} 삭제 금지(하위호환 유지)` });
      }
    }
    if (!content.includes('source("../src")')) {
      violations.push({ file, line: 0, msg: '@source 스코프(source("../src")) 제거 금지 — 문서 클래스가 프로덕션 CSS에 샘' });
    }
  }
}

function checkFile(file, violations) {
  if (!existsSync(file)) return;
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    return;
  }
  if (/\.(ts|tsx)$/.test(file)) checkTsx(file, content, violations);
  else if (/\.css$/.test(file)) checkCss(file, content, violations);
}

function walk(dir, out) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === 'dist') continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css)$/.test(e)) out.push(p);
  }
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

const args = process.argv.slice(2);
let files = [];
if (args.includes('--hook')) {
  try {
    const data = JSON.parse(await readStdin());
    const fp = data?.tool_input?.file_path;
    if (fp) files = [fp];
  } catch {
    process.exit(0); // 훅 입력 파싱 실패는 통과(차단하지 않음)
  }
} else if (args.length) {
  files = args;
} else if (existsSync('src')) {
  walk('src', files);
}

const violations = [];
for (const f of files) checkFile(f, violations);

if (violations.length) {
  console.error('\n✗ 디자인 규칙 위반 (docs/design/do-dont.md 참고):');
  for (const v of violations) console.error(`  ${v.file}:${v.line}  ${v.msg}`);
  console.error('');
  process.exit(2);
}
process.exit(0);
