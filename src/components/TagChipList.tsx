// 생성: 2026-07-01
export interface TagChipListProps {
  tags: string[];
  onRemove?: (tag: string) => void;
}

// 태그 칩 목록(무상태). 작고 낮은 대비의 pill로 표시(디자인: 칩/태그 스펙).
// 빈 배열이면 칩이 하나도 없어 아무 텍스트도 렌더하지 않는다.
// onRemove를 넘기면 각 칩 우측에 × 삭제 버튼을 렌더한다(미전달 시 기존 무상태 표시).
export function TagChipList({ tags, onRemove }: TagChipListProps) {
  // × 클릭이 부모 카드 핸들러로 전파되지 않도록 차단 후 해당 태그를 제거 요청한다.
  const handleRemove = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    onRemove?.(tag);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-surface-container text-on-surface-variant text-label-md inline-flex items-center gap-1 rounded-full px-3 py-1"
        >
          {tag}
          {onRemove && (
            <button
              type="button"
              aria-label={`${tag} 삭제`}
              onClick={(e) => handleRemove(e, tag)}
              className="text-outline hover:text-on-surface-variant cursor-pointer leading-none"
            >
              ×
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
