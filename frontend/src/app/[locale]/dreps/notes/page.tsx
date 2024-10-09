'use client';
import NotesPage from '@/components/dreps/notes/NotesPage';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import { Suspense } from 'react';

function Notes() {
  return (
    <div>
      <BreadCrumbs
        crumbs={[
          {
            label: 'Notes',
            href: `/dreps/notes`,
          },
        ]}
      />
      <div className="base_container">
        <Suspense fallback={null}>
          <section className="mt-4">
            <NotesPage />
          </section>
        </Suspense>
      </div>
    </div>
  );
}

export default Notes;
