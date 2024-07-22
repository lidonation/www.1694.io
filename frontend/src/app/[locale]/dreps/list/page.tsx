import SearchBar from '@/components/atoms/SearchBar';
import DRepsTable from '@/components/molecules/DRepsTable';
import React from 'react';

type PageProps = {
  searchParams?: {
    s?: string;
    page?: string;
  };
};
const page = ({ searchParams }: PageProps) => {
  const query = searchParams?.s || '';
  const page = Number(searchParams?.page) || 1;

  return (
    <div className="base_container py-10">
      <section className="mb-12">
        <h2 className="text-7xl font-black">Available DReps</h2>
      </section>
      <section className="mb-10 flex justify-end">
        <SearchBar />
      </section>

      <section className="rounded-md bg-white p-5 shadow">
        <DRepsTable query={query} page={page} />
      </section>
    </div>
  );
};

export default page;
