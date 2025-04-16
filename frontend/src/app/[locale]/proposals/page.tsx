'use client';
import ProposalCard from '@/components/molecules/ProposalCard';
import ProposalCardSkeleton from '@/components/1694.io/ProposalCardSkeleton';
import { useGetActionsProposalsQuery } from '@/hooks/useGetActionsProposalsQuery';
import React, { useState } from 'react';
import Pagination from '@/components/molecules/Pagination';
import ProposalSearch from '@/components/atoms/ProposalSearch';
import { useProposalFilters } from '@/hooks/useProposalFilters';

function ProposalsPage() {
  const {
    currentPage,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    showFilter,
    setShowFilter,
    showSort,
    setShowSort,
    selectedCategories,
    setSelectedCategories,
  } = useProposalFilters();

  const [pageSize] = useState(12);

  const { actionsProposals, isActionsProposalsLoading } = useGetActionsProposalsQuery(
    currentPage,
    pageSize,
    search,
    selectedCategories.join(','),
    sortBy,
    sortOrder,
  );

  const totalPages = actionsProposals?.meta?.pagination?.pageCount || 1;
  const totalItems = actionsProposals?.meta?.pagination?.total || 0;

  return (
    <div className="base_container min-h-screen py-10">
      <section className="mb-6">
        <h2 className="text-7xl font-black">Proposals</h2>
      </section>

      <section className="relative mb-6 rounded-full p-2 w-full max-w-7xl mx-auto">
        <ProposalSearch
          search={search}
          setSearch={setSearch}
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          showSort={showSort}
          setShowSort={setShowSort}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />
      </section>

      <section>
        <ul className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-2 xl:grid-cols-3">
          {isActionsProposalsLoading
            ? [...Array(pageSize)].map((_, index) => (
                <li key={index}>
                  <ProposalCardSkeleton />
                </li>
              ))
            : actionsProposals?.data?.map((proposal, index) => (
                <li key={index}>
                  <ProposalCard proposal={proposal} />
                </li>
              ))}
        </ul>

        {!isActionsProposalsLoading && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              dataType="proposals"
            />
          </div>
        )}
      </section>
    </div>
  );
}

export default ProposalsPage;
