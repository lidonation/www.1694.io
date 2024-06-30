'use client';

import Button from '@/components/atoms/Button';
import { useRouter } from 'next/navigation';

function NoteHeaderTitle() {
  const router = useRouter();

  function handleNavigate() {
    router.push('/dreps/workflow/notes/new');
  }

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-8xl font-black">Notes</h2>

      <Button
        size="extraLarge"
        width={'11.25rem'}
        variant="outlined"
        bgColor="transparent"
        color="primary"
        handleClick={handleNavigate}
      >
        New Note
      </Button>
    </div>
  );
}

export default NoteHeaderTitle;
