---
name: design-system
description: 이 앱(Toss-Inspired Note System)의 디자인 시스템 — 색·타이포·간격·반경·그림자·컴포넌트(버튼/카드/입력/칩)·디자인 토큰을 다룬다. UI/스타일/디자인 작업, Tailwind 클래스 선택, 색상·폰트·여백·반경 결정, 새 컴포넌트 styling, 기존 컴포넌트 리스타일/마이그레이션을 할 때 — 'design' 또는 'design-system'을 직접 언급하지 않더라도 — 이 스킬을 사용할 것. 시작 시 docs/design/README.md를 읽고, 작업 종류에 맞는 파일만 추가로 읽는다.
---

# design-system

이 앱의 모든 스타일 작업이 따라야 할 디자인 시스템 라우터다. **콘텐츠의 진실원천은
`docs/design/*.md`(사람·Claude 공용 레퍼런스)와 `src/index.css`의 `@theme`(런타임 토큰 값)**이며,
이 스킬은 내용을 복제하지 않고 **작업에 필요한 파일로 안내**한다.

## 비협상 가드레일 (항상 적용)

1. 색은 항상 `@theme` 시맨틱 토큰으로. raw 색(`bg-blue-500`·인라인 hex) 금지.
2. Tailwind 기본 반경 스케일(`--radius-xl/lg/md`)을 design 값으로 **덮어쓰지 말 것**(기존 화면 깨짐).
   반경은 `rounded-card`(24px)·`rounded-field`(16px)·`rounded-full`을 쓴다.
3. **한글 텍스트에 Inter·Plus Jakarta Sans 금지**(글리프 없음). 폰트는 Pretendard 유지, `--text-*`에
   family 넣지 말 것.
4. 기존 별칭 토큰 7개(`bg-card`/`text-foreground`/`text-muted-foreground`/`border-border`/
   `text-destructive`/`bg-muted`/`bg-foreground`)는 **유지**(삭제·일괄 치환 금지). 점진 전환만.

## 워크플로

1. **먼저** `docs/design/README.md`(개요·배선 메모·목차)를 읽는다.
2. 작업 종류에 맞는 파일**만** 추가로 읽는다(아래 라우터). 전체를 한꺼번에 읽지 않는다.
3. 규칙 충돌이 의심되면 `docs/design/do-dont.md`로 최종 확인한다.

## 라우터 (작업 → 읽을 파일)

| 작업                               | 읽을 파일                       |
| ---------------------------------- | ------------------------------- |
| 색 선택·텍스트 위계·Primary/CTA 색 | `docs/design/colors.md`         |
| 글자 크기·굵기·줄높이·폰트         | `docs/design/typography.md`     |
| 여백·간격·반경·형상                | `docs/design/spacing-radius.md` |
| 그림자·깊이·hover 입체감·보더      | `docs/design/elevation.md`      |
| 버튼/노트카드/입력/칩/리스트 스펙  | `docs/design/components.md`     |
| Do/Don't·안티패턴 점검             | `docs/design/do-dont.md`        |
| 기존 클래스를 design 토큰으로 전환 | `docs/design/token-map.md`      |

## 주의

- 이 스킬·CLAUDE.md·`docs/design/*`가 어긋나면 **`docs/design/*` + `@theme`가 정본**이다.
  스킬 본문에 토큰 값·표를 복제하지 말 것(드리프트 방지) — 항상 참조로 연결한다.
- 토큰을 추가/변경하면 `src/index.css`의 `@theme`와 해당 `docs/design/*` 표를 **함께** 갱신한다.
