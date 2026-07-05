import { act, renderHook } from '@testing-library/react';
import { useTagInput } from './useTagInput'; // 아직 미구현 → import 실패 = 정당한 RED

describe('useTagInput', () => {
  it('should append the parsed tag and clear tagInput when committing "react"', () => {
    const { result } = renderHook(() => useTagInput([]));
    act(() => result.current.setTagInput('react'));
    act(() => result.current.commit());
    expect(result.current.tags).toEqual(['react']);
    expect(result.current.tagInput).toBe('');
  });

  // 이슈 #3 AC1 갭 봉합: 쉼표 다중 입력 커밋이 [...prev, ...parsed] 스프레드로 N=2를 실제 반영하는지.
  // (parsed[0]만 취하는 회귀를 잡는 가드 — parseTagInput 단위테스트만으론 이 경로가 미검증)
  it('should append both tags and clear tagInput when committing "react, study"', () => {
    const { result } = renderHook(() => useTagInput([]));
    act(() => result.current.setTagInput('react, study'));
    act(() => result.current.commit());
    expect(result.current.tags).toEqual(['react', 'study']);
    expect(result.current.tagInput).toBe('');
  });

  it('should set tags to initialTags and clear tagInput when reset is called with ["react","study"]', () => {
    const { result } = renderHook(() => useTagInput([]));
    act(() => result.current.setTagInput('draft'));
    act(() => result.current.reset(['react', 'study']));
    expect(result.current.tags).toEqual(['react', 'study']);
    expect(result.current.tagInput).toBe('');
  });

  it('should leave tags unchanged when committing blank/whitespace input', () => {
    const { result } = renderHook(() => useTagInput([]));
    act(() => result.current.setTagInput('   '));
    act(() => result.current.commit());
    expect(result.current.tags).toEqual([]);
  });

  it('should append a duplicate (no dedup in #2) when the same tag is committed twice', () => {
    const { result } = renderHook(() => useTagInput([]));
    act(() => result.current.setTagInput('react'));
    act(() => result.current.commit());
    act(() => result.current.setTagInput('react'));
    act(() => result.current.commit());
    expect(result.current.tags).toEqual(['react', 'react']);
  });

  it('should clear tags to [] when reset is called with []', () => {
    const { result } = renderHook(() => useTagInput(['react']));
    act(() => result.current.reset([]));
    expect(result.current.tags).toEqual([]);
  });
});
