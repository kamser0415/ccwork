# 컴포넌트 스펙 (Components)

토큰 어휘로 표기한다(값은 [colors.md](./colors.md)·[typography.md](./typography.md)·
[spacing-radius.md](./spacing-radius.md) 참조). 기존 컴포넌트 전환 시 [token-map.md](./token-map.md).

## 버튼 (Buttons)

- **Primary**: `bg-primary-container`(Toss Blue) + `text-on-primary`, 크게(min-height ~52px),
  `rounded-field`(16px). 주요 액션에 절제해서.
- **Secondary**: `bg-surface-container-low` 배경 + `text-primary` 또는 `text-on-surface`.
- 상태: hover 시 `opacity`/톤 변화, `disabled:opacity-40`.

## 노트 카드 (Note Cards)

- 패딩 24px(`p-stack-lg`), 제목 `text-headline-md`, 2줄 미리보기 `text-body-md`(`text-on-surface-variant`).
- `bg-surface-container-lowest` + `rounded-card`. 선택/hover는 [elevation.md](./elevation.md)의 그림자 단계.

## 입력 필드 (Input Fields)

- 검색바·텍스트 입력은 **보더 대신 옅은 회색 배경** `bg-surface-container-low`.
- **포커스 시** 흰 배경 + 1px `border-primary-container`로 전환.

## 칩 / 태그 (Chips / Tags)

- 작고 낮은 대비의 pill — `bg-surface-container` 배경 + `text-label-md`, `rounded-full`.
- 기능 버튼과 형태로 구분(사각 버튼처럼 만들지 말 것).

## 하단 내비게이션 (Mobile)

- 고대비 아이콘 + 명확한 라벨. "새 노트" 액션은 떠 있는 파란 FAB 또는 눈에 띄는 중앙 액션.

## 리스트 (Lists)

- 여백 또는 1px `outline-variant` 구분선으로 행 분리. 가로 패딩은 전역 페이지 마진과 일치.
