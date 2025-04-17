'use client';

import React, { useState } from 'react';
import ProposalCard from '@/components/molecules/ProposalCard';
import ProposalCardSkeleton from '@/components/1694.io/ProposalCardSkeleton';
import Pagination from '@/components/molecules/Pagination';
import ProposalSearch from '@/components/atoms/ProposalSearch';
import RecordsNotFound from '@/components/atoms/RecordsNotFound';
import ProposalMetrics from '@/components/atoms/ProposalMetrics';

// hooks
import { useProposalFilters } from '@/hooks/useProposalFilters';
import { useGetActionsProposalsQuery } from '@/hooks/useGetActionsProposalsQuery';

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

  const {
    actionsProposals: allFilteredProposals,
    isActionsProposalsLoading: isAllLoading,
  } = useGetActionsProposalsQuery(
    1,
    10000,
    search,
    selectedCategories.join(','),
    sortBy,
    sortOrder
  );

  const {
    actionsProposals: paginatedProposals,
    isActionsProposalsLoading: isPaginatedLoading,
  } = useGetActionsProposalsQuery(
    currentPage,
    pageSize,
    search,
    selectedCategories.join(','),
    sortBy,
    sortOrder
  );

  const totalPages = paginatedProposals?.meta?.pagination?.pageCount || 1;
  const totalItems = paginatedProposals?.meta?.pagination?.total || 0;
  const proposalsData = paginatedProposals?.data || [];

  return (
    <div className="base_container min-h-screen py-10">
      <section className="mb-6">
        <h2 className="text-7xl font-black">Proposals</h2>
      </section>

      <section className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="w-full lg:w-[45%]">
          <ProposalMetrics />
        </div>
        <div className="w-full lg:w-[55%] flex justify-end">
          <div className="w-full">
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
          </div>
        </div>
      </section>

      <section>
        {!isPaginatedLoading && proposalsData.length === 0 ? (
          <RecordsNotFound message="No proposals match your criteria." />
        ) : (
          <ul className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-2 xl:grid-cols-3">
            {isPaginatedLoading
              ? Array.from({ length: pageSize }).map((_, index) => (
                  <li key={index}>
                    <ProposalCardSkeleton />
                  </li>
                ))
              : proposalsData.map((proposal, index) => (
                  <li key={index}>
                    <ProposalCard proposal={proposal} />
                  </li>
                ))}
          </ul>
        )}

        {!isPaginatedLoading && proposalsData.length > 0 && (
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
