import { act, renderHook } from '@testing-library/react';
import { NotesProvider, useNotes } from './NotesContext';
import * as api from '../api/notes';

vi.mock('../api/notes'); // api 모듈 전체 모킹(네트워크 차단)

describe('NotesContext - createNote', () => {
  beforeEach(() => {
    vi.mocked(api.fetchNotes).mockResolvedValue([]); // 마운트 로드 통과용
    vi.mocked(api.createNote).mockResolvedValue({
      id: '1',
      title: 't',
      content: 'c',
      tags: ['react'],
      createdAt: 'x',
      updatedAt: 'y',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call api.createNote with { title, content, tags } when creating a note', async () => {
    const { result } = renderHook(() => useNotes(), { wrapper: NotesProvider });

    await act(async () => {
      // 현재 createNote 시그니처는 (title, content)라 tags를 무시 → api.createNote는 { title, content }로만 호출됨 → 단언 실패 RED
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (result.current.createNote as any)('t', 'c', ['react']);
    });

    expect(api.createNote).toHaveBeenCalledWith({ title: 't', content: 'c', tags: ['react'] });
  });
});
