# Do / Don't

스타일 작업 시 반드시 지킨다. 값·토큰 상세는 [colors.md](./colors.md) 등 형제 문서,
기존→신토큰 전환은 [token-map.md](./token-map.md) 참조.

> **[강제]** = `scripts/check-design.mjs`가 편집(Claude PostToolUse 훅)·커밋(pre-commit) 시 기계적으로
> 차단한다(결정적). **[리뷰]** = 코드로 판정 불가 → 모델 준수 + 사람 리뷰.

## ✅ Do

- 색은 항상 `@theme` 토큰으로. 신규·수정 코드는 design 토큰 우선(`bg-surface*`, `text-on-surface`,
  `text-on-surface-variant`, `bg-primary-container`, `border-outline-variant`, `text-error`).
- 주 CTA는 `bg-primary-container`(Toss Blue) + `text-on-primary`를 **절제해서** 사용. hover/pressed·강조
  텍스트는 `primary`.
- 카드 `rounded-card`(24px), 버튼/입력 `rounded-field`(16px), 칩/태그 `rounded-full`.
- 깊이는 옅은 ambient shadow(`shadow-[0_2px_12px_rgba(0,0,0,0.07)]` 류, 6~12%)와 톤 레이어링
  (`surface-container` 단계)으로. 입력은 보더 대신 `bg-surface-container-low`, 포커스 시 흰 배경 + 1px
  `border-primary-container`.
- 타이포는 스케일 토큰으로(`text-headline-md`, `text-body-lg`, `text-label-md`). 본문 줄높이 1.6. 위계는
  색으로도: 제목 `text-on-surface`, 본문 `text-on-surface-variant`, 메타/힌트 `text-outline`.
- 간격은 8px 베이스, 큰 섹션 분리는 `gap-stack-xl`/`p-stack-xl`(48px). 폰트는 Pretendard 유지.
- 마이그레이션은 **컴포넌트 단위**로, 매핑표 참고, 시각 회귀 확인 후 다음으로.

## ❌ Don't

- **[강제]** raw 색(`bg-blue-500`, 인라인 hex) 금지 — 반드시 토큰.
- **[강제]** Tailwind 기본 반경 스케일(`--radius-xl/lg/md`)을 design 값으로 **덮어쓰지 말 것**(기존 버튼/입력/카드 깨짐).
- **[강제]** `--color-background`를 `#faf8ff`로 바꾸지 말 것(이름 충돌). 필요 시 `surface`.
- **[강제]** **Inter/Plus Jakarta Sans를 한글 텍스트에 쓰지 말 것**(글리프 없음). `--text-*`에 family 넣지 말 것.
- **[강제]** 기존 별칭 토큰 7개(`bg-card` 등) 삭제 금지(하위호환 유지). 일괄 치환도 금지 — 점진 전환만.
- **[리뷰]** Primary 블루 남발·칩을 사각 버튼처럼·강한 보더로 영역 분리 금지(흰-위-흰에만 1px `outline-variant`).
- **[리뷰]** 1회용 임의 스타일 조합 난발 금지(버튼/카드/입력/칩 패턴 재사용).
