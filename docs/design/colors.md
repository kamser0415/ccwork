# 색 (Colors)

값의 진실원천은 `src/index.css` `@theme`. Tailwind v4가 각 `--color-<name>`에서 `bg-<name>` /
`text-<name>` / `border-<name>` 유틸을 생성한다. 순백 배경을 기반으로 "숨 쉬는" 여백을 극대화한다.

## 색 역할 (먼저 읽기)

- **Primary:** 시그니처 블루 **#0064FF = `primary-container`**는 주요 액션·활성 상태에만 **절제해서**
  쓴다(임팩트 유지). `primary`(#004ecb)는 hover/pressed·강조 텍스트.
- **Neutrals:** 큰 배경 면(사이드바·리스트 컨테이너)은 `surface-container-low`(#f2f3ff, 프로즈 #F2F4F6),
  옅은 보더·구분선은 `outline-variant`(#c2c6d8, 프로즈 #E5E8EB).
- **텍스트 위계는 크기보다 색으로:** 제목 `on-surface`(#191b24), 본문 `on-surface-variant`(#424656),
  메타/힌트 `outline`(#737687).

## Surfaces

| 토큰                        | 값      | 예시 클래스                    |
| --------------------------- | ------- | ------------------------------ |
| `surface`                   | #faf8ff | `bg-surface`                   |
| `surface-dim`               | #d8d9e6 | `bg-surface-dim`               |
| `surface-bright`            | #faf8ff | `bg-surface-bright`            |
| `surface-container-lowest`  | #ffffff | `bg-surface-container-lowest`  |
| `surface-container-low`     | #f2f3ff | `bg-surface-container-low`     |
| `surface-container`         | #ecedfa | `bg-surface-container`         |
| `surface-container-high`    | #e6e7f4 | `bg-surface-container-high`    |
| `surface-container-highest` | #e1e2ee | `bg-surface-container-highest` |
| `surface-variant`           | #e1e2ee | `bg-surface-variant`           |
| `surface-tint`              | #0054d8 | `bg-surface-tint`              |
| `inverse-surface`           | #2e303a | `bg-inverse-surface`           |
| `inverse-on-surface`        | #eff0fd | `text-inverse-on-surface`      |

> `background`(#faf8ff)는 기존 `--color-background`와 이름 충돌로 토큰화하지 않음 → `surface` 사용.

## On-surface / Outline

| 토큰                 | 값      | 예시 클래스               | 용도             |
| -------------------- | ------- | ------------------------- | ---------------- |
| `on-surface`         | #191b24 | `text-on-surface`         | 제목/주 텍스트   |
| `on-surface-variant` | #424656 | `text-on-surface-variant` | 본문 텍스트      |
| `on-background`      | #191b24 | `text-on-background`      | 배경 위 텍스트   |
| `outline`            | #737687 | `text-outline`            | 메타/힌트        |
| `outline-variant`    | #c2c6d8 | `border-outline-variant`  | 옅은 보더/구분선 |

## Primary (주 CTA)

| 토큰                       | 값      | 예시 클래스                     |
| -------------------------- | ------- | ------------------------------- |
| `primary`                  | #004ecb | `text-primary` (hover/강조)     |
| `on-primary`               | #ffffff | `text-on-primary`               |
| `primary-container`        | #0064ff | `bg-primary-container` (주 CTA) |
| `on-primary-container`     | #f5f5ff | `text-on-primary-container`     |
| `inverse-primary`          | #b3c5ff | —                               |
| `primary-fixed`            | #dbe1ff | —                               |
| `primary-fixed-dim`        | #b3c5ff | —                               |
| `on-primary-fixed`         | #00174a | —                               |
| `on-primary-fixed-variant` | #003ea6 | —                               |

## Secondary

| 토큰                         | 값      |
| ---------------------------- | ------- |
| `secondary`                  | #0059b9 |
| `on-secondary`               | #ffffff |
| `secondary-container`        | #1071e5 |
| `on-secondary-container`     | #fefcff |
| `secondary-fixed`            | #d7e2ff |
| `secondary-fixed-dim`        | #acc7ff |
| `on-secondary-fixed`         | #001a40 |
| `on-secondary-fixed-variant` | #004491 |

## Tertiary

| 토큰                        | 값      |
| --------------------------- | ------- |
| `tertiary`                  | #a03200 |
| `on-tertiary`               | #ffffff |
| `tertiary-container`        | #ca4101 |
| `on-tertiary-container`     | #fff4f0 |
| `tertiary-fixed`            | #ffdbd0 |
| `tertiary-fixed-dim`        | #ffb59c |
| `on-tertiary-fixed`         | #390c00 |
| `on-tertiary-fixed-variant` | #832700 |

## Error

| 토큰                 | 값      | 예시 클래스               |
| -------------------- | ------- | ------------------------- |
| `error`              | #ba1a1a | `text-error`              |
| `on-error`           | #ffffff | `text-on-error`           |
| `error-container`    | #ffdad6 | `bg-error-container`      |
| `on-error-container` | #93000a | `text-on-error-container` |

→ 전환 가이드(기존 `text-destructive` 등 ↔ 위 토큰)는 [token-map.md](./token-map.md).
