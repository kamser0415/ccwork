// 생성: 2026-07-01
import { KeyboardEvent } from 'react';

export interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}

// 태그 입력창(무상태). 입력은 onChange로, Enter 커밋은 onCommit으로 위로 올린다.
// 한글 IME 조합 중 Enter는 조합 확정용이므로 e.nativeEvent.isComposing으로 가드해 커밋하지 않는다.
export function TagInput({ value, onChange, onCommit }: TagInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onCommit();
    }
  };

  return (
    <input
      type="text"
      aria-label="태그 입력"
      placeholder="태그 입력 (쉼표로 구분)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-full bg-surface-container-low text-on-surface text-body-md rounded-field px-3 py-2 border border-transparent outline-none placeholder:text-on-surface-variant focus:bg-surface-container-lowest focus:border-primary-container transition-colors"
    />
  );
}
