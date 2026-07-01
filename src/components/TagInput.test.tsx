import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput'; // 아직 미구현 → import 실패 = 정당한 RED

describe('TagInput', () => {
  it('should call onCommit when Enter is pressed and not composing', () => {
    const onCommit = vi.fn();
    render(<TagInput value="react" onChange={() => {}} onCommit={onCommit} />);
    fireEvent.keyDown(screen.getByLabelText('태그 입력'), { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('should call onChange with the new value when the user types', async () => {
    const onChange = vi.fn();
    render(<TagInput value="" onChange={onChange} onCommit={() => {}} />);
    await userEvent.type(screen.getByLabelText('태그 입력'), 'r');
    expect(onChange).toHaveBeenCalledWith('r');
  });

  it('should NOT call onCommit when Enter is pressed during IME composition', () => {
    const onCommit = vi.fn();
    render(<TagInput value="리액트" onChange={() => {}} onCommit={onCommit} />);
    fireEvent.keyDown(screen.getByLabelText('태그 입력'), { key: 'Enter', isComposing: true });
    expect(onCommit).not.toHaveBeenCalled();
  });
});
