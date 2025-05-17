'use client';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import ProposalCard from '@/components/molecules/ProposalCard';
import ProposalCardSkeleton from '@/components/1694.io/ProposalCardSkeleton';
import Pagination from '@/components/molecules/Pagination';
import ProposalSearch from '@/components/atoms/ProposalSearch';
import RecordsNotFound from '@/components/atoms/RecordsNotFound';
import ProposalMetrics from '@/components/atoms/ProposalMetrics';
import { ProposalDownloadButton } from '@/components/molecules/ProposalDownloadButton';
import { useGetActionsProposalsQuery } from '@/hooks/useGetActionsProposalsQuery';
import { useDebounce } from 'use-debounce';

function ProposalsPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [pageSize] = useState(12);
  const currentPage = Number(searchParams.get('page')) || 1;
  const [debouncedSearch] = useDebounce(search, 300);

  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const committees = searchParams.get('committees')?.split(',').filter(Boolean) || [];
  const sortBy = searchParams.get('sort') || 'updatedAt';
  const sortOrder = ['asc', 'desc'].includes(searchParams.get('order') || '')
    ? (searchParams.get('order') as 'asc' | 'desc')
    : 'desc';

  const {
    actionsProposals: allFilteredProposals,
    isActionsProposalsLoading: isAllLoading,
  } = useGetActionsProposalsQuery(
    1,
    10000,
    debouncedSearch,
    categories,
    committees,
    sortBy,
    sortOrder
  );

  const {
    actionsProposals: paginatedProposals,
    isActionsProposalsLoading: isPaginatedLoading,
  } = useGetActionsProposalsQuery(
    currentPage,
    pageSize,
    debouncedSearch,
    categories,
    committees,
    sortBy,
    sortOrder
  );
  const proposalsData = paginatedProposals?.data || [];

  return (
    <div className="base_container min-h-screen py-10">
      <section className="mb-4">
        <h2 className="text-7xl font-black">Budget Proposals</h2>
        <div className="py-3 pr-16 lg:pr-56">
          <p>
            Cardano 2025 budget proposals. Your comments and responses to polls
            here will also be published back to gov.tools and other interfaces.
          </p>
        </div>
      </section>

      <section className="relative mb-6 rounded-full py-2 w-full max-w-7xl mx-auto lg:flex lg:flex-nowrap lg:items-center gap-4 justify-between">
        <div className="w-full lg:w-[45%]">
          <ProposalMetrics search={debouncedSearch} categories={categories} committees={committees} />
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
            />
          </div>
        </div>
      </section>
      <section className="w-full max-w-7xl mx-auto flex justify-end mb-4">
        <ProposalDownloadButton
          proposals={allFilteredProposals?.data || []}
          searchQuery={debouncedSearch}
          categoryFilter={categories}
          committeeFilter={committees}
        />
      </section>
      <section>
        {!isPaginatedLoading && proposalsData.length === 0 ? (
          <RecordsNotFound message="No proposals match your criteria." />
        ) : (
          <ul className="grid grid-cols-1 gap-6 py-6 xl:grid-cols-2 2xl:grid-cols-3">
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
              totalPages={paginatedProposals?.last_page || 1}
              totalItems={paginatedProposals?.total || 0}
              dataType="proposals"
            />
          </div>
        )}
      </section>
    </div>
  );
}

export default ProposalsPage;