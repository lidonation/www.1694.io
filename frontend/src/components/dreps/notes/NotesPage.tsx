'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SingleNote from './SingleNote';
import NotesPageHeader from './NotesPageHeader';
import { CircularProgress, List, Skeleton } from '@mui/material';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { useGetNotesQuery } from '@/hooks/useGetNotesQuery';
import useInfiniteScroll from 'react-easy-infinite-scroll-hook';
const LoaderComponent = () => {
  return Array.from({ length: 4 }).map((_, index) => (
    <div
      className="flex flex-col gap-1 rounded-xl bg-white bg-opacity-70 p-5 shadow-md"
      key={index}
    >
      <Skeleton variant="text" width={150} />
      <Skeleton variant="text" height={100} />
      <Skeleton variant="text" />
      <Skeleton variant="text" />
    </div>
  ));
};

function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { stakeKeyBech32, isEnabled } = useCardano();
  const { isLoggedIn } = useDRepContext();
  const [dominantNoteId, setDominantNoteId] = useState<number | undefined>(
    undefined,
  );
  const [currentNoteId, setCurrentNoteId] = useState<number | undefined>(
    undefined,
  );
  const [request, setRequest] = useState<'before' | 'after'>('before');
  const [prevScrollTop, setPrevScrollTop] = useState(0);
  const [scrollDirection, setScrollDirection] = useState(null);
  const [allNotes, setAllNotes] = useState<any[]>([]);
  const noteRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [hasMoreBelow, setHasMoreBelow] = useState(true);
  const [hasMoreAbove, setHasMoreAbove] = useState(true);
  const { Notes, isNotesLoading, isNotesFetching, isPreviousData } =
    useGetNotesQuery({
      currentNote: currentNoteId,
      request: request,
    });
  useEffect(() => {
    if (allNotes && allNotes.length > 0) {
      const topMostNote = allNotes[0];
      if (!dominantNoteId) {
        setDominantNoteId(topMostNote.note_id);
        updateURL(topMostNote.note_id.toString());
      }
    }
  }, [allNotes, dominantNoteId]);

  useEffect(() => {
    if (Notes && !isPreviousData) {
      setAllNotes((prevNotes) => {
        // Create a Map to store unique notes, with note_id as the key
        const uniqueNotesMap = new Map(
          [...prevNotes, ...Notes].map((note) => [note.note_id, note]),
        );

        // Convert the Map values back to an array
        const uniqueNotes = Array.from(uniqueNotesMap.values());
        uniqueNotes.sort((a, b) => b.note_id - a.note_id);
        // Sort notes by note_id in descending order (assuming higher IDs are more recent)
        return uniqueNotes;
      });
      if (scrollDirection === 'down') {
        setHasMoreBelow(Notes.length > 1);
      } else if (scrollDirection === 'up') {
        setHasMoreAbove(Notes.length > 1);
      }
    }
  }, [Notes, isPreviousData]);
  const ref = useInfiniteScroll({
    next: async (scrollDirection) => fetchMoreData(),
    rowCount: allNotes.length,
    hasMore: { down: hasMoreBelow, up: hasMoreAbove },
    onScroll: (event) => {
      handleScroll(event);
      updateDominantNote();
    },
  });
  useEffect(() => {
    const urlNote = searchParams.get('note');
    if (urlNote) {
      setCurrentNoteId(Number(urlNote));
    }
  }, []);
  const updateDominantNote = useCallback(() => {
    if (allNotes && allNotes.length > 0) {
      const windowHeight = window.innerHeight;
      let maxVisibleArea = 0;
      let dominantNote = allNotes[0];

      allNotes.forEach((note) => {
        const element = noteRefs.current[note.note_id];
        if (element) {
          const rect = element.getBoundingClientRect();
          const visibleHeight =
            Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
          if (visibleHeight > maxVisibleArea) {
            maxVisibleArea = visibleHeight;
            dominantNote = note;
          }
        }
      });

      if (dominantNote.note_id !== dominantNoteId) {
        setDominantNoteId(dominantNote.note_id);
        updateURL(dominantNote.note_id.toString());
      }
    }
  }, [allNotes, dominantNoteId]);
  const handleScroll = useCallback(
    (event) => {
      const currentScrollTop = event.scrollTop;
      const isScrollingDown = currentScrollTop > prevScrollTop;
      setScrollDirection(isScrollingDown ? 'down' : 'up');
      setPrevScrollTop(currentScrollTop);
    },
    [prevScrollTop],
  );

  const updateURL = (noteId?: string) => {
    const params = new URLSearchParams(searchParams);
    if (noteId) params.set('note', noteId);
    router.replace(`?${params.toString()}`, { scroll: false });
  };
  const fetchMoreDataDown = useCallback(() => {
    if (!isNotesFetching && !isPreviousData && allNotes.length > 0) {
      setCurrentNoteId(allNotes[allNotes.length - 1].note_id);
      setRequest('before');
    }
  }, [isNotesFetching, allNotes]);

  const fetchMoreDataUp = useCallback(() => {
    if (!isNotesFetching && !isPreviousData) {
      setCurrentNoteId(allNotes[0].note_id);
      setRequest('after');
    }
  }, [isNotesFetching, allNotes]);
  const fetchMoreData = useCallback(() => {
    if (scrollDirection === 'down') {
      fetchMoreDataDown();
    } else if (scrollDirection === 'up') {
      fetchMoreDataUp();
    }
  }, [scrollDirection]);
  return (
    <div className="flex h-screen flex-col gap-5 bg-white bg-opacity-50 px-5 py-10">
      <NotesPageHeader />
      <List
        id="scrollableDiv"
        ref={ref as any}
        style={{
          height: 1000,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
        }}
      >
        {isNotesFetching && scrollDirection === 'up' && (
          <div className="flex items-center justify-center">
            <CircularProgress size={40} />
          </div>
        )}
        {isNotesLoading ? (
          <LoaderComponent />
        ) : (
          allNotes &&
          allNotes.length > 0 &&
          allNotes.map((note) => {
            return (
              <div
                key={note.note_id}
                className="w-full"
                ref={(el: any) => (noteRefs.current[note.note_id] = el)}
              >
                <SingleNote
                  note={note}
                  currentVoter={stakeKeyBech32}
                  isEnabled={isEnabled}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            );
          })
        )}
        {isNotesFetching && scrollDirection === 'down' && <LoaderComponent />}
        {allNotes.length === 0 && !isNotesLoading && <p>No notes</p>}
      </List>
    </div>
  );
}

export default NotesPage;
