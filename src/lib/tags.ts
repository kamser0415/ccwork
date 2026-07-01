// 입력 문자열을 태그 배열로 변환한다.
// #2 범위: 앞뒤 공백 제거 후 빈 문자열이면 [], 아니면 [trimmed] (0개 또는 1개).
// (쉼표 분리·길이 검증(#3)·대소문자 중복 제거(#4)는 후속 이슈에서 이 함수 동작을 확장한다.)
export function parseTagInput(input: string): string[] {
  const trimmed = input.trim();
  return trimmed === '' ? [] : [trimmed];
}
