# 별칭 ↔ 토큰 매핑 (점진 전환 가이드)

기존 7개 시맨틱 별칭(`bg-card` 등)은 **하위호환으로 유지**된다(삭제·일괄 치환 금지). 값이 미세하게
다르므로 **컴포넌트 단위로 의도적으로** 교체하고 시각 회귀를 확인한다. 토큰 값 자체는 바꾸지 않으므로
클래스명을 교체하기 전까지 기존 화면은 그대로다.

| 기존 별칭(유지)                      | design 토큰                                                     | 비고                  |
| ------------------------------------ | --------------------------------------------------------------- | --------------------- |
| `bg-card`                            | `bg-surface-container-lowest`                                   | 정확히 일치           |
| `text-foreground`                    | `text-on-surface`                                               | 거의 동일             |
| `bg-background`(body)                | `bg-surface`                                                    | near-white로 밝아짐   |
| `text-muted-foreground`              | `text-on-surface-variant` (메타엔 `text-outline`)               | 더 어두워짐           |
| `border-border`                      | `border-outline-variant` (옅은 분리선 `surface-container-high`) | 약간 진해짐           |
| `text-destructive`                   | `text-error`                                                    | 더 진함               |
| `bg-muted`                           | `bg-surface-container` (사이드바엔 `surface-container-low`)     | —                     |
| `bg-foreground text-card`(다크 버튼) | `bg-primary-container text-on-primary`                          | Toss 1차 버튼 전환 시 |

## 반경 매핑 (가이드)

| design 의도 | px   | Tailwind 기본 클래스 | 시맨틱 토큰     |
| ----------- | ---- | -------------------- | --------------- |
| 카드        | 24px | `rounded-3xl`        | `rounded-card`  |
| 버튼/입력   | 16px | `rounded-2xl`        | `rounded-field` |
| 칩/태그     | pill | `rounded-full`       | `rounded-full`  |

> Tailwind `rounded-xl`은 12px이라 design xl(24px)과 **이름만** 다르다. 기본 반경 스케일(`--radius-xl`
> 등)은 **덮어쓰지 않는다**(→ [spacing-radius.md](./spacing-radius.md) 캐비엇).
