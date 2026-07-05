import { fireEvent, render, screen } from '@testing-library/react';
import { TagChipList } from './TagChipList';

describe('TagChipList', () => {
  it('should render one chip per tag when tags=["react","study"]', () => {
    render(<TagChipList tags={['react', 'study']} />);
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();
  });

  it('should render no tag text when tags=[] (빈 배열)', () => {
    const { container } = render(<TagChipList tags={[]} />);
    expect(container.textContent).toBe('');
  });

  // --- 이슈 #5: 칩 × 개별 삭제 (spec §6) ---
  // TagChipList에 onRemove/× 버튼이 아직 없어 아래는 단언 실패(버튼 미존재)로 실행 RED.

  // AC1: 칩의 ×를 누르면 해당 태그만 제거된다 → onRemove(tag) 호출 검증
  it('should call onRemove with the tag when its × button is clicked', () => {
    const onRemove = vi.fn();
    render(<TagChipList tags={['react', 'study']} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'react 삭제' }));
    expect(onRemove).toHaveBeenCalledWith('react');
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  // AC3: × 클릭이 부모 카드 핸들러로 전파되지 않는다(stopPropagation)
  it('should not propagate the click to the parent handler when the × button is clicked', () => {
    const onRemove = vi.fn();
    const onParentClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <TagChipList tags={['react']} onRemove={onRemove} />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'react 삭제' }));
    expect(onRemove).toHaveBeenCalledWith('react');
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
