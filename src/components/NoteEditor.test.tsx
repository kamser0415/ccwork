import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesProvider } from '../context/NotesContext';
import { NoteEditor } from './NoteEditor';
import * as api from '../api/notes';

// NoteEditor 통합 시나리오(#2). api 모듈 전체 모킹 + NotesProvider로 폼↔영속 흐름을 표현한다.
// 현재 NoteEditor에는 태그 UI가 없어 `getByLabelText('태그 입력')`이 없다 → 미구현 행동으로 인한 정당한 RED.
vi.mock('../api/notes');

// App의 선택 상태(selectedNoteId/isCreating)를 흉내 내는 최소 하네스.
// 새 노트 작성 → 저장/취소 후 onDone에서 reopenId 노트를 다시 여는 "재진입"을 모델링한다.
function EditorHarness({ reopenId = null }: { reopenId?: string | null }) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(true);
  return (
    <NoteEditor
      selectedNoteId={selectedNoteId}
      isCreating={isCreating}
      onDone={() => {
        setIsCreating(false);
        setSelectedNoteId(reopenId); // reopenId=null → 빈 선택 상태, '1' → 저장된 노트 재진입
      }}
    />
  );
}

// 기존 노트 열기 하네스: 실제 앱 흐름(리스트 로드 → 클릭으로 선택)을 모델링한다.
// NoteEditor의 폼 동기화 effect는 selectedNoteId 변화에 반응하므로, "로드 후 선택" 순서를 지켜야 폼이 채워진다.
function LegacyOpenHarness() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  return (
    <>
      <button onClick={() => setSelectedNoteId('1')}>열기</button>
      <NoteEditor selectedNoteId={selectedNoteId} isCreating={false} onDone={() => {}} />
    </>
  );
}

describe('NoteEditor (통합) - 태그 저장·영속/취소/기존 노트 호환', () => {
  beforeEach(() => {
    vi.mocked(api.fetchNotes).mockResolvedValue([]); // 마운트 로드 통과용(기본)
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should persist tags and show them on reopen when a tag is added and saved', async () => {
    // 저장 시 서버가 돌려주는 노트(태그 포함). 재진입 시 이 노트를 열어 칩이 보여야 한다.
    vi.mocked(api.createNote).mockResolvedValue({
      id: '1',
      title: '제목',
      content: '',
      tags: ['react'],
      createdAt: 'x',
      updatedAt: 'y',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(
      <NotesProvider>
        <EditorHarness reopenId="1" />
      </NotesProvider>,
    );

    // 제목 입력(저장 전제)
    const titleInput = await screen.findByPlaceholderText('제목');
    await userEvent.type(titleInput, '제목');

    // 태그 입력창에 'react' 입력 후 Enter → 칩 표시
    const tagInput = screen.getByLabelText('태그 입력');
    await userEvent.type(tagInput, 'react');
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('react')).toBeInTheDocument();

    // 저장 → api.createNote가 tags까지 포함해 호출(영속)
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() =>
      expect(api.createNote).toHaveBeenCalledWith({ title: '제목', content: '', tags: ['react'] }),
    );

    // 재진입(onDone이 노트 '1'을 선택) → 저장된 태그가 다시 보인다
    expect(await screen.findByText('react')).toBeInTheDocument();
  });

  it('should discard added tags when canceled without saving', async () => {
    render(
      <NotesProvider>
        <EditorHarness />
      </NotesProvider>,
    );

    // 태그를 추가했다가
    const tagInput = await screen.findByLabelText('태그 입력');
    await userEvent.type(tagInput, 'react');
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('react')).toBeInTheDocument();

    // 저장하지 않고 취소
    await userEvent.click(screen.getByRole('button', { name: '취소' }));

    // 저장이 일어나지 않았고(영속 X), 추가했던 태그도 사라진다(폐기)
    expect(api.createNote).not.toHaveBeenCalled();
    expect(screen.queryByText('react')).not.toBeInTheDocument();
  });

  it('should save without error and start with tags=[] when opening a legacy note (no tags) and editing the title', async () => {
    // 기존(legacy) 노트: tags 정규화는 fetchNotes 경계의 책임(시그니처 §2·§7)이므로,
    // NoteEditor에 도달한 시점엔 tags=[]가 보장된다. raw [] 정규화 자체는 fetchNotes 단위테스트가 커버.
    const legacy = {
      id: '1',
      title: '옛 노트',
      content: '본문',
      tags: [],
      createdAt: 'x',
      updatedAt: 'y',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    vi.mocked(api.fetchNotes).mockResolvedValue([legacy]);
    vi.mocked(api.updateNote).mockResolvedValue({ ...legacy, title: '옛 노트!' });

    render(
      <NotesProvider>
        <LegacyOpenHarness />
      </NotesProvider>,
    );

    // 로드(fetchNotes→setNotes) 후 노트를 연다(선택) — 실제 앱 흐름
    await userEvent.click(screen.getByRole('button', { name: '열기' }));

    // 레거시 노트가 로드되어 폼에 반영(무오류)
    const titleInput = await screen.findByDisplayValue('옛 노트');
    // 태그 UI는 있고(편집 가능), tags=[]라 칩은 없다
    expect(screen.getByLabelText('태그 입력')).toBeInTheDocument();
    expect(screen.queryByText('react')).not.toBeInTheDocument();

    // 제목 수정 후 저장 → updateNote 호출, 에러 없음
    await userEvent.type(titleInput, '!');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(api.updateNote).toHaveBeenCalled());
  });

  // --- AC 검증 보강 (이미 구현된 동작의 커버리지·단언 강화) ---

  it('should not add a chip when Enter is pressed during IME composition', async () => {
    render(
      <NotesProvider>
        <EditorHarness />
      </NotesProvider>,
    );

    // 태그 입력창에 입력 후, 한글 IME 조합 중 Enter(조합 확정용)를 보낸다
    const tagInput = await screen.findByLabelText('태그 입력');
    await userEvent.type(tagInput, 'react');
    fireEvent.keyDown(tagInput, { key: 'Enter', isComposing: true });

    // 조합 중 Enter는 커밋이 아니므로 칩이 생기지 않는다(가드가 통합 레벨에서도 유지)
    expect(screen.queryByText('react')).not.toBeInTheDocument();
  });

  // --- 이슈 #5: 삭제 영속 배선 (AC2) ---
  // 칩 ×로 태그를 지운 뒤 저장하면, 삭제가 반영된 tags 배열로 createNote가 호출된다.
  // NoteEditor가 아직 onRemove를 TagChipList에 연결하지 않아 × 버튼이 없다 → 단언 실패(버튼 미존재)로 실행 RED.
  it('should persist the reduced tags (removed chip excluded) when a chip is removed and saved', async () => {
    vi.mocked(api.createNote).mockResolvedValue({
      id: '1',
      title: '제목',
      content: '',
      tags: ['study'],
      createdAt: 'x',
      updatedAt: 'y',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(
      <NotesProvider>
        <EditorHarness reopenId="1" />
      </NotesProvider>,
    );

    // 제목 입력(저장 전제)
    const titleInput = await screen.findByPlaceholderText('제목');
    await userEvent.type(titleInput, '제목');

    // 태그 두 개 추가: react, study
    const tagInput = screen.getByLabelText('태그 입력');
    await userEvent.type(tagInput, 'react, study');
    fireEvent.keyDown(tagInput, { key: 'Enter' });
    expect(screen.getByText('react')).toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();

    // react 칩의 ×를 눌러 삭제 → react만 사라지고 study는 남는다
    await userEvent.click(screen.getByRole('button', { name: 'react 삭제' }));
    expect(screen.queryByText('react')).not.toBeInTheDocument();
    expect(screen.getByText('study')).toBeInTheDocument();

    // 저장 → 삭제가 반영된 tags=["study"]로 영속
    await userEvent.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() =>
      expect(api.createNote).toHaveBeenCalledWith({
        title: '제목',
        content: '',
        tags: ['study'],
      }),
    );
  });

  it('should call updateNote with tags=[] when saving a legacy note without adding tags', async () => {
    const legacy = {
      id: '1',
      title: '옛 노트',
      content: '본문',
      tags: [],
      createdAt: 'x',
      updatedAt: 'y',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    vi.mocked(api.fetchNotes).mockResolvedValue([legacy]);
    vi.mocked(api.updateNote).mockResolvedValue({ ...legacy, title: '옛 노트!' });

    render(
      <NotesProvider>
        <LegacyOpenHarness />
      </NotesProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: '열기' }));
    const titleInput = await screen.findByDisplayValue('옛 노트');
    await userEvent.type(titleInput, '!');
    await userEvent.click(screen.getByRole('button', { name: '저장' }));

    // 태그를 더하지 않은 레거시 노트는 빈 배열 tags까지 포함해 영속된다(AC3 인자 단언)
    await waitFor(() =>
      expect(api.updateNote).toHaveBeenCalledWith('1', {
        title: '옛 노트!',
        content: '본문',
        tags: [],
      }),
    );
  });
});
