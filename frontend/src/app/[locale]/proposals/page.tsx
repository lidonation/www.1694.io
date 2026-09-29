'use client';
import { useSearchParams } from 'next/navigation';
import React, { useState } from 'react';
import ProposalCard from '@/components/molecules/ProposalCard';
import ProposalCardSkeleton from '@/components/1694.io/ProposalCardSkeleton';
import Pagination from '@/components/molecules/Pagination';
import ProposalSearch from '@/components/atoms/ProposalSearch';
import RecordsNotFound from '@/components/atoms/RecordsNotFound';
import ProposalMetrics from '@/components/atoms/ProposalMetrics';
import ProposalsFilterChips from '@/components/atoms/ProposalsFilterChips';
import { ProposalDownloadButton } from '@/components/molecules/ProposalDownloadButton';
import { useGetActionsProposalsQuery } from '@/hooks/useGetActionsProposalsQuery';
import { useDebounce } from 'use-debounce';
import { useEffect } from 'react';
import {
  FRESHNESS_STALE_THRESHOLD_DAYS,
  formatProposalCardDate,
  getDatasetFreshness,
  selectDatasetFreshness,
  shouldShowDatasetStaleWarning,
  type DatasetFreshness,
} from '@/lib/utils';
import axiosInstance from '@/services/axiosInstance';

function ProposalsPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [pageSize] = useState(12);
  const currentPage = Number(searchParams.get('page')) || 1;
  const [debouncedSearch] = useDebounce(search, 300);

  const categories =
    searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const committees =
    searchParams.get('committees')?.split(',').filter(Boolean) || [];
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
    sortOrder,
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
    sortOrder,
  );
  const proposalsData = paginatedProposals?.data || [];
  const allProposals = allFilteredProposals?.data || [];
  const freshness = getDatasetFreshness(allProposals);
  const [serverFreshness, setServerFreshness] =
    useState<DatasetFreshness | null>(null);

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get('/actions-proposals/freshness', {
        params: { thresholdDays: FRESHNESS_STALE_THRESHOLD_DAYS },
      })
      .then((res) => {
        if (!cancelled) setServerFreshness(res.data);
      })
      .catch(() => {
        if (!cancelled) setServerFreshness(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasActiveFilters =
    debouncedSearch !== '' || categories.length > 0 || committees.length > 0;
  const fresh = selectDatasetFreshness(
    serverFreshness,
    freshness,
    hasActiveFilters,
    isAllLoading,
  );
  const showStale = shouldShowDatasetStaleWarning(fresh);
  const newestLabel = fresh?.newestUpdatedAt
    ? formatProposalCardDate(fresh.newestUpdatedAt)
    : null;

  return (
    <div className="base_container min-h-screen py-10">
      <section className="mb-4">
        <h2 className="text-7xl font-black">Budget Proposals</h2>
        <div className="py-3 pr-16 lg:pr-56">
          <p>
            Archive of the Cardano 2025 budget cycle. Your comments and
            responses to polls here will also be published back to gov.tools and
            other interfaces.
          </p>
          {newestLabel ? (
            <p className="pt-1 text-sm text-gray-500">
              Newest record: {newestLabel}
              {typeof fresh.ageDays === 'number'
                ? ` (${fresh.ageDays} days ago)`
                : ''}
            </p>
          ) : null}
          {showStale ? (
            <p
              role="status"
              className="mt-2 inline-block rounded bg-amber-100 px-3 py-1 text-sm text-amber-900"
            >
              Data may be stale: no new budget records in over{' '}
              {fresh.thresholdDays} days. Source: Catalyst Explorer.
            </p>
          ) : null}
        </div>
      </section>

      <section className="mb-5 flex w-full flex-col gap-4 py-2 lg:flex-row lg:flex-nowrap lg:items-center lg:justify-between">
        <ProposalMetrics
          search={debouncedSearch}
          categories={categories}
          committees={committees}
        />
        <ProposalSearch
          search={search}
          setSearch={setSearch}
          showFilter={showFilter}
          setShowFilter={setShowFilter}
          showSort={showSort}
          setShowSort={setShowSort}
        />
      </section>
      <section className="mx-auto mb-2 flex w-full flex-col">
        <div className="flex w-full flex-col justify-between gap-4 py-2 lg:flex-row lg:items-center">
          <div className="w-auto flex-wrap gap-2 overflow-x-auto py-2">
            <ProposalsFilterChips />
          </div>
          <div className="flex-shrink-0 py-2">
            <ProposalDownloadButton
              proposals={allFilteredProposals?.data || []}
              searchQuery={debouncedSearch}
              categoryFilter={categories}
              committeeFilter={committees}
            />
          </div>
        </div>
        <div>
          {!isPaginatedLoading && proposalsData.length === 0 ? (
            <RecordsNotFound message="No proposals match your criteria." />
          ) : (
            <ul className="grid grid-cols-1 gap-6 pt-1 pb-2 xl:grid-cols-2 2xl:grid-cols-3">
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
        </div>

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
