// 생성: 2026-07-01
export interface TagChipListProps {
  tags: string[];
}

// 태그 칩 목록(무상태). 작고 낮은 대비의 pill로 표시(디자인: 칩/태그 스펙).
// 빈 배열이면 칩이 하나도 없어 아무 텍스트도 렌더하지 않는다.
export function TagChipList({ tags }: TagChipListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="bg-surface-container text-on-surface-variant text-label-md rounded-full px-3 py-1"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
