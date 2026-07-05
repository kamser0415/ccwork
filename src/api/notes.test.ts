import { fetchNotes } from './notes';

// API mock 설정이 없으므로 fetch를 직접 stub 한다(SKILL.md mock 레시피).
describe('fetchNotes', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should default tags to [] when a fetched note has no tags field', async () => {
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [
        { id: '1', title: 'a', content: 'b', createdAt: 'x', updatedAt: 'y' }, // tags 없음
      ],
    });

    const notes = await fetchNotes();

    // 현재 구현은 res.json()을 그대로 반환(정규화 없음) → tags === undefined → 단언 실패 RED
    expect(notes[0].tags).toEqual([]);
  });
});
