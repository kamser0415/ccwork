// 입력 문자열을 태그 배열로 변환한다 (spec §5 1~4단계).
// 1) 쉼표(,)로 split → 2) 각 조각 trim → 3) 빈 문자열 제거 → 4) 20자 초과 조각은 무시 + console.error.
// (대소문자 무시 중복 제거(§5 5단계)는 후속 이슈 #4에서 이 함수 동작을 확장한다.)
const MAX_TAG_LENGTH = 20; // spec §5: 태그 1개는 trim 후 최대 20자

export function parseTagInput(input: string): string[] {
  const chunks = input
    .split(',')
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk !== '');

  return chunks.filter((chunk) => {
    if (chunk.length > MAX_TAG_LENGTH) {
      console.error(`태그는 ${MAX_TAG_LENGTH}자 이하만 가능합니다`);
      return false;
    }
    return true;
  });
}

// 기존 태그(prev)와 신규 파싱 결과(incoming)를 대소문자 무시로 병합·중복 제거한다 (spec §5 5단계).
// 첫 등장 원형(casing) 유지, prev 원형 보존. 순수 함수(부수효과 없음).
export function mergeTags(prev: string[], incoming: string[]): string[] {
  const seen = new Set(prev.map((tag) => tag.toLowerCase()));
  const added: string[] = [];
  for (const tag of incoming) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue; // prev 또는 앞선 incoming과 대소문자 무시 중복 → 제외
    seen.add(key);
    added.push(tag); // 첫 등장 원형 유지
  }
  return [...prev, ...added];
}
