'use client';
import NotesPage from '@/components/dreps/notes/NotesPage';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import { Suspense } from 'react';

function Notes() {
  return (
    <div className="base_container">
      <Suspense fallback={null}>
        <BreadCrumbs
          crumbs={[
            {
              label: 'Notes',
              href: `/dreps/notes`,
            },
          ]}
        />
        <section className="mt-6">
          <NotesPage />
        </section>
      </Suspense>
    </div>
  );
}

export default Notes;
