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
