import { parseTagInput } from './tags'; // 아직 미구현 → import 실패 = 정당한 RED

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
