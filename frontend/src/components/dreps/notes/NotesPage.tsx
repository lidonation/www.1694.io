'use client';
import SingleNote from './SingleNote';
import NotesPageHeader from './NotesPageHeader';
import { useEffect, useState } from 'react';
import { getNotes } from '@/services/requests/getNotes';
import { Skeleton } from '@mui/material';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { useGetNotesQuery } from '@/hooks/useGetNotesQuery';

function NotesPage() {
  const [notes, setNotes] = useState<any[]>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { stakeKeyBech32, isEnabled } = useCardano();
  const { isLoggedIn } = useDRepContext();
  const { Notes } = useGetNotesQuery();
  useEffect(() => {
    const getAllNotes = async () => {
      try {
        const sortedNotes = Notes.sort(
          (a, b) =>
            new Date(b.note_createdAt).getTime() -
            new Date(a.note_createdAt).getTime(),
        );
        setNotes(sortedNotes);
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        console.log(error);
      }
    };
    getAllNotes();

  }, [Notes]);
  return (
    <div className="flex min-h-screen flex-col gap-5 bg-white bg-opacity-50 px-5 py-10">
      <NotesPageHeader />
      {/* loading stage */}
      {isLoading &&
        Array.from({ length: 3 }).map((value, index) => (
          <div
            className="flex flex-col gap-1 rounded-xl bg-white bg-opacity-70 p-5 shadow-md"
            key={index}
          >
            <Skeleton variant="text" width={150} />
            <Skeleton variant="text" height={100} />
            <Skeleton variant="text" />
            <Skeleton variant="text" />
          </div>
        ))}

      {/* loaded stage */}
      {notes &&
        !isLoading &&
        notes?.map((note, index) => (
          <div key={index} className="w-full">
            <SingleNote
              note={note}
              currentVoter={stakeKeyBech32}
              isEnabled={isEnabled}
              isLoggedIn={isLoggedIn}
            />
          </div>
        ))}
      {/* empty stage */}
      {(!notes || notes?.length === 0) && !isLoading && <p>No notes</p>}
    </div>
  );
}

export default NotesPage;
