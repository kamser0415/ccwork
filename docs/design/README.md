# 디자인 시스템 — Toss-Inspired Note System

노트 앱의 디자인 시스템을 **관심사별로 분할한 레퍼런스**다. 런타임 토큰 값의 **진실원천은
`src/index.css`의 `@theme` 블록**이며, 이 문서들은 그 값을 사람이 읽기 쉽게 표·가이드로 미러한다.

> **Claude Code는 이 시스템을 `design-system` 스킬로 접근한다**(스타일/UI 작업 시 자동 트리거).
> 스킬은 아래 파일 중 작업에 필요한 것만 읽는 얇은 라우터다 → `.claude/skills/design-system/SKILL.md`.
> 사람은 이 README의 목차에서 필요한 문서로 이동하면 된다.

## 브랜드 & 스타일

절대적 명료함·속도·친근함을 우선한다. 현대 핀테크 인터페이스에서 영감을 받아 모든 노트를 가치 있는
자산처럼 다루고, 넉넉한 여백으로 인지 부하를 줄인다.

스타일은 **Modern Minimalism** — 촉각적 정제(tactile refinement)에 초점. 불필요한 장식을 피하고
고품질 타이포그래피와 미묘한 깊이로 사용자를 안내한다. 감정적 목표는 "힘들이지 않는 생산성
(effortless productivity)" — 앱을 여는 순간 정돈된 느낌. 대상은 "빈 캔버스"의 자유로움을 원하면서도
정교한 도구의 구조적 신뢰성을 요구하는 전문가·학생이다.

## 배선 메모 (구현 기준)

- **`@theme`가 토큰 값의 정본**이다(과거 design.md frontmatter의 YAML은 이 폴더의 표로 이관).
- **주 CTA = `bg-primary-container`(#0064FF Toss Blue) + `text-on-primary`**. `primary`(#004ecb)는
  hover/pressed·강조 텍스트용. (Material 관례와 달리 시그니처 블루가 `primary-container`에 있음.)
- **폰트는 Pretendard 유지**(한국어 UI). 타이포는 *스케일*만 토큰화했고 Inter/Plus Jakarta Sans는
  로드하지 않는다 — 두 폰트엔 한글 글리프가 없다.
- 반경은 `rounded-card`(24px)·`rounded-field`(16px)·`rounded-full`(칩). Tailwind 기본
  `rounded-xl/lg/md` 스케일은 **덮어쓰지 않는다**(기존 화면 보호).
- `background`(#faf8ff)는 기존 `--color-background`와 이름이 충돌해 토큰으로 추가하지 않았다 —
  같은 값인 `surface`/`surface-bright`를 쓴다.

## 목차

| 문서                                     | 내용                                               |
| ---------------------------------------- | -------------------------------------------------- |
| [colors.md](./colors.md)                 | 색 토큰 표 + 색 역할(Primary·neutrals·텍스트 위계) |
| [typography.md](./typography.md)         | 타이포 스케일 7토큰 + 폰트 가이드                  |
| [spacing-radius.md](./spacing-radius.md) | 간격·반경 토큰 + 형상(Shapes)                      |
| [elevation.md](./elevation.md)           | 그림자·깊이·톤 레이어링                            |
| [components.md](./components.md)         | 버튼·노트카드·입력·칩·리스트 스펙                  |
| [do-dont.md](./do-dont.md)               | Do / Don't · 안티패턴                              |
| [token-map.md](./token-map.md)           | 기존 별칭 ↔ 토큰 매핑(점진 전환 가이드)            |
