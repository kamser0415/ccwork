import { mergeTags, parseTagInput, removeTag } from './tags';

describe('parseTagInput', () => {
  it('should return ["react"] when input is "react"', () => {
    expect(parseTagInput('react')).toEqual(['react']);
  });

  it('should return [] when input is "" (빈 문자열)', () => {
    expect(parseTagInput('')).toEqual([]);
  });

  it('should return [] when input is "   " (공백만)', () => {
    expect(parseTagInput('   ')).toEqual([]);
  });

  it('should return ["react"] when input is "  react  " (앞뒤 공백 trim)', () => {
    expect(parseTagInput('  react  ')).toEqual(['react']);
  });

  // --- 이슈 #3: 쉼표 다중 입력 + 길이/빈값 정규화 (spec §5 1~4단계) ---
  // #2 구현(trim→[]/[trimmed])에선 아래가 단언 실패로 RED. (단일칩·빈값·단일 trim은 위 #2 테스트가 커버)

  it('should return ["react","study"] when input is "react, study"', () => {
    expect(parseTagInput('react, study')).toEqual(['react', 'study']);
  });

  it('should return ["a","b"] when input is "a,,b" (연속 쉼표 빈 조각 제거)', () => {
    expect(parseTagInput('a,,b')).toEqual(['a', 'b']);
  });

  it('should return ["a","b"] when input is "a, , b" (공백 조각 제거)', () => {
    expect(parseTagInput('a, , b')).toEqual(['a', 'b']);
  });

  it('should return ["react","study"] when input is " react , study " (조각별 trim)', () => {
    expect(parseTagInput(' react , study ')).toEqual(['react', 'study']);
  });

  it('should return [] when input is "," (쉼표만)', () => {
    expect(parseTagInput(',')).toEqual([]);
  });

  it('should keep the chunk when a chunk is exactly 20 chars (상한 경계)', () => {
    const twenty = 'a'.repeat(20);
    expect(parseTagInput(twenty)).toEqual([twenty]);
  });

  it('should return ["a","a"] when input is "a,a" (중복 미제거 — #4 소관)', () => {
    expect(parseTagInput('a,a')).toEqual(['a', 'a']);
  });

  it('should ignore the >20-char chunk and console.error while keeping valid chunks', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseTagInput('a'.repeat(21) + ', ok')).toEqual(['ok']);
    expect(errSpy).toHaveBeenCalledWith('태그는 20자 이하만 가능합니다');
    errSpy.mockRestore();
  });

  it('should return [] and console.error when the only chunk exceeds 20 chars', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseTagInput('a'.repeat(21))).toEqual([]);
    expect(errSpy).toHaveBeenCalledWith('태그는 20자 이하만 가능합니다');
    errSpy.mockRestore();
  });

  it('should console.error once per over-length chunk when input has two >20-char chunks', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(parseTagInput('a'.repeat(21) + ', ' + 'b'.repeat(21))).toEqual([]);
    expect(errSpy).toHaveBeenCalledTimes(2);
    errSpy.mockRestore();
  });
});

// --- 이슈 #4: 대소문자 무시 중복 방지 (spec §5 5단계) ---
// mergeTags는 아직 throw 골격 → 아래 전부 not implemented로 실행 RED.
describe('mergeTags', () => {
  // 정상
  it('should return ["React","vue"] when prev=["React"], incoming=["react","vue"] (react 무시, React 원형 유지)', () => {
    expect(mergeTags(['React'], ['react', 'vue'])).toEqual(['React', 'vue']);
  });

  it('should return ["a","b"] when prev=["a"], incoming=["b"] (중복 없는 일반 병합)', () => {
    expect(mergeTags(['a'], ['b'])).toEqual(['a', 'b']);
  });

  // 경계
  it('should return [] when prev=[], incoming=[] (양쪽 빈)', () => {
    expect(mergeTags([], [])).toEqual([]);
  });

  it('should return ["x"] when prev=["x"], incoming=[] (추가 없음)', () => {
    expect(mergeTags(['x'], [])).toEqual(['x']);
  });

  it('should return ["a"] when prev=[], incoming=["a","A"] (입력 내부 대소문자 중복 제거, 첫 등장 유지)', () => {
    expect(mergeTags([], ['a', 'A'])).toEqual(['a']);
  });

  it('should return ["study"] when prev=["study"], incoming=["STUDY"] (기존과 대소문자만 다른 중복 미추가)', () => {
    expect(mergeTags(['study'], ['STUDY'])).toEqual(['study']);
  });

  it('should not mutate prev or incoming (순수 함수 — 원본 배열 불변)', () => {
    const prev = ['React'];
    const incoming = ['react', 'vue'];
    mergeTags(prev, incoming);
    expect(prev).toEqual(['React']);
    expect(incoming).toEqual(['react', 'vue']);
  });
});

// --- 이슈 #5: 칩 × 개별 삭제 (spec §6) ---
// removeTag는 아직 throw 골격 → 아래 전부 not implemented로 실행 RED.
describe('removeTag', () => {
  // 정상
  it('should return ["study"] when tags=["react","study"], target="react" (해당 태그만 제거·순서 유지)', () => {
    expect(removeTag(['react', 'study'], 'react')).toEqual(['study']);
  });

  // 경계
  it('should return ["a","b"] when tags=["a","b"], target="z" (없는 태그 → 변화 없는 새 배열)', () => {
    expect(removeTag(['a', 'b'], 'z')).toEqual(['a', 'b']);
  });

  it('should return [] when tags=["x"], target="x" (마지막 태그 제거 → 빈 배열)', () => {
    expect(removeTag(['x'], 'x')).toEqual([]);
  });

  it('should return [] when tags=[], target="x" (빈 입력)', () => {
    expect(removeTag([], 'x')).toEqual([]);
  });

  // 예외 (대소문자 구분 — 삭제는 정확 일치)
  it('should NOT remove and return ["React"] when tags=["React"], target="react" (대소문자만 다르면 제거 안 함)', () => {
    expect(removeTag(['React'], 'react')).toEqual(['React']);
  });
});
