import { render, screen } from '@testing-library/react';
import { TagChipList } from './TagChipList'; // 아직 미구현 → import 실패 = 정당한 RED

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
});
