# 간격 · 반경 · 형상 (Spacing · Radius · Shapes)

## 간격 (Spacing)

8px 베이스 리듬. `--spacing-<name>`은 `p-/m-/gap-/space-y-<name>` 등 유틸을 생성하며 숫자 스케일
(`gap-2`, `px-8`)과 충돌하지 않는다(가산).

| 토큰       | 값   | 클래스 예시    | 대응 숫자 클래스 |
| ---------- | ---- | -------------- | ---------------- |
| `stack-sm` | 8px  | `gap-stack-sm` | `gap-2`          |
| `stack-md` | 16px | `p-stack-md`   | `p-4`            |
| `stack-lg` | 24px | `gap-stack-lg` | `gap-6`          |
| `stack-xl` | 48px | `p-stack-xl`   | `p-12`           |
| `gutter`   | 24px | `gap-gutter`   | `gap-6`          |

토큰화하지 않은 레이아웃 값(숫자 클래스로 처리):

- `margin-mobile` 20px → `px-5`, `margin-desktop` 40px → `px-10`
- `container-max-width` 1200px → `max-w-[1200px]`. 단, **에디터 본문은 max-width 800px**로 가운데 정렬해
  종이 한 장 느낌(`max-w-[800px] mx-auto`).
- **리듬**: 큰 콘텐츠 섹션 분리는 `stack-xl`(48px)로 — UI가 답답해 보이지 않게.

## 반경 (Radius)

형상 언어는 "Super-Ellipse"와 큰 반경. **시맨틱 반경 토큰**을 쓰며, 이는 Tailwind 기본 `rounded-*`
스케일을 **덮어쓰지 않는 별도 이름**이다.

| 용도          | 토큰/클래스     | 값            |
| ------------- | --------------- | ------------- |
| 카드·컨테이너 | `rounded-card`  | 24px (1.5rem) |
| 버튼·입력     | `rounded-field` | 16px (1rem)   |
| 칩·태그       | `rounded-full`  | pill          |

> ⚠️ **캐비엇**: `--radius-xl/lg/md` 같은 Tailwind 기본 반경 스케일을 디자인 값으로 정의하면 기존
> `rounded-xl`(0.75rem) 버튼/입력이 깨진다. **덮어쓰지 말 것.** Tailwind 기본 클래스로 같은 px를 내려면:
> 24px = `rounded-3xl`, 16px = `rounded-2xl`(↔ `rounded-card`/`rounded-field`와 동일 px). (Tailwind
> `rounded-xl`은 12px이라 디자인 xl(24px)과 이름만 다름.)

## 형상 (Shapes)

- **카드 & 컨테이너**: 큰 반경(`rounded-card`)으로 주 콘텐츠/노트 미리보기.
- **버튼 & 입력**: `rounded-field`로 친근하고 터치하기 좋은 느낌.
- **작은 요소**: 칩·태그는 완전 둥근(pill, `rounded-full`) 형태로 기능 버튼과 구분.
