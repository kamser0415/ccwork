// 생성: 2026-03-23
import { useState } from 'react';
import { NotesProvider } from './context/NotesContext';
import { Layout } from './components/Layout';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { SearchBar } from './components/SearchBar';

function App() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [query, setQuery] = useState('');

  const handleSelectNote = (id: string) => {
    setSelectedNoteId(id);
    setIsCreating(false);
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setIsCreating(true);
  };

  const handleDone = () => {
    setIsCreating(false);
    // 저장 후 선택 상태는 유지
  };

  return (
    <NotesProvider>
      <Layout
        onNewNote={handleNewNote}
        sidebar={
          <>
            <SearchBar value={query} onChange={setQuery} />
            <NoteList
              selectedNoteId={selectedNoteId}
              onSelect={handleSelectNote}
              query={query}
            />
          </>
        }
        main={
          <NoteEditor
            selectedNoteId={selectedNoteId}
            isCreating={isCreating}
            onDone={handleDone}
          />
        }
      />
    </NotesProvider>
  );
}

export default App;
