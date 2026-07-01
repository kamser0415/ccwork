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
});
