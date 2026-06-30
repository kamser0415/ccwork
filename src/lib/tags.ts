// RED 골격(skeleton) — 시그니처만 있고 행동은 없다.
// GREEN 단계에서 throw 본문을 실제 로직으로 교체한다(파일·시그니처 유지).
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- 골격: 파라미터는 GREEN에서 사용
export function parseTagInput(_input: string): string[] {
  throw new Error('not implemented');
}
