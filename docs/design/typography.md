# 타이포그래피 (Typography)

값의 진실원천은 `src/index.css` `@theme`. Tailwind v4가 `--text-<name>`(+페어드
`--text-<name>--line-height/--font-weight/--letter-spacing`)에서 `text-<name>` **한 클래스**로
크기+굵기+줄높이+자간을 한꺼번에 적용한다.

> **폰트는 Pretendard Variable 유지**(한국어 UI). 타이포 토큰엔 `font-family`가 없으므로(그리고
> Tailwind v4 `--text-*`는 family 페어링을 지원하지 않으므로) 본문의 Pretendard가 그대로 상속된다.
> **Inter / Plus Jakarta Sans는 로드하지 않는다 — 한글 글리프가 없다.** (원본 디자인의 fontFamily 필드는
> 의도적으로 무시.)

## 스케일 토큰

| 토큰                 | 크기 | 굵기 | 줄높이 | 자간    | 클래스                    | 용도              |
| -------------------- | ---- | ---- | ------ | ------- | ------------------------- | ----------------- |
| `display-lg`         | 40px | 700  | 1.2    | -0.02em | `text-display-lg`         | 최상위 디스플레이 |
| `headline-lg`        | 28px | 700  | 1.3    | -0.01em | `text-headline-lg`        | 큰 제목           |
| `headline-lg-mobile` | 24px | 700  | 1.3    | —       | `text-headline-lg-mobile` | 모바일 큰 제목    |
| `headline-md`        | 20px | 600  | 1.4    | —       | `text-headline-md`        | 카드/섹션 제목    |
| `body-lg`            | 17px | 400  | 1.6    | —       | `text-body-lg`            | 본문(긴 글)       |
| `body-md`            | 15px | 400  | 1.5    | —       | `text-body-md`            | 본문/미리보기     |
| `label-md`           | 13px | 500  | 1.4    | 0.01em  | `text-label-md`           | 라벨/칩/메타      |

## 가이드

- **제목**: 굵고 임팩트 있게. 글자가 커질수록 줄높이를 키워 프리미엄/에디토리얼 느낌 유지.
- **본문**: 1.6 줄높이로 넉넉하게 — 긴 노트도 읽기 편하게.
- **모바일 스케일링**: 디스플레이 제목은 줄바꿈 과다를 막기 위해 작게(예:
  `text-headline-lg-mobile md:text-headline-lg`), 단 굵기는 유지.
- **위계는 색으로도**: 제목 `text-on-surface`, 본문 `text-on-surface-variant`, 메타/힌트 `text-outline`
  (→ [colors.md](./colors.md)).
