import { useState } from 'react';
import { mergeTags, parseTagInput } from '../lib/tags';

export interface UseTagInputResult {
  tags: string[];
  tagInput: string;
  setTagInput: (value: string) => void;
  commit: () => void;
  reset: (initialTags: string[]) => void;
}

// 태그 입력 상태(현재 태그 배열 + 입력창 값)와 동작을 캡슐화한 훅.
// #2 범위: commit(Enter 단일 추가)·reset(폼 동기화)만. remove(#5)·flush(#6)는 후속 이슈에서 추가.
export function useTagInput(initialTags: string[] = []): UseTagInputResult {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState('');

  // 입력창 값을 파싱해 태그로 추가하고 입력창을 비운다(빈/공백이면 무동작).
  const commit = () => {
    const parsed = parseTagInput(tagInput);
    if (parsed.length > 0) {
      setTags((prev) => mergeTags(prev, parsed)); // #4: 대소문자 무시 중복 제거
    }
    setTagInput('');
  };

  // 폼 동기화: 선택된 노트의 태그로 초기화하고 입력창을 비운다.
  const reset = (nextTags: string[]) => {
    setTags(nextTags);
    setTagInput('');
  };

  return { tags, tagInput, setTagInput, commit, reset };
}
