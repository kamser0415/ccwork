// 생성: 2026-03-23
import { useNotes } from '../context/NotesContext';
import { NoteItem } from './NoteItem';

interface NoteListProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  query: string;
}

export function NoteList({ selectedNoteId, onSelect, query }: NoteListProps) {
  const { notes, loading, error, deleteNote } = useNotes();

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
    } catch (e) {
      console.error('삭제에 실패했습니다', e);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">로딩 중...</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive text-center py-8">오류: {error}</p>
    );
  }

  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">노트가 없습니다</p>
    );
  }

  const keyword = query.trim().toLowerCase();
  const filtered = keyword
    ? notes.filter(
        (note) =>
          note.title.toLowerCase().includes(keyword) ||
          note.content.toLowerCase().includes(keyword),
      )
    : notes;

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">검색 결과가 없습니다</p>
    );
  }

  return (
    <>
      <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground px-1 pb-1">
        노트 {filtered.length}개
      </p>
      {filtered.map((note) => (
        <NoteItem
          key={note.id}
          note={note}
          isSelected={note.id === selectedNoteId}
          onSelect={onSelect}
          onDelete={handleDelete}
        />
      ))}
    </>
  );
}
