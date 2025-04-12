'use client';

import ProposalCard from '@/components/molecules/ProposalCard';
import ProposalCardSkeleton from '@/components/1694.io/ProposalCardSkeleton';
import { useGetActionsProposalsQuery } from '@/hooks/useGetActionsProposalsQuery';
import React, { useState } from 'react';
import Pagination from '@/components/molecules/Pagination';
import { useSearchParams } from 'next/navigation';

function ProposalsPage() {
  const searchParams = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const [pageSize] = useState(6);

  const { actionsProposals, isActionsProposalsLoading } =
    useGetActionsProposalsQuery(currentPage, pageSize);

  const totalPages = actionsProposals?.meta?.pagination?.pageCount || 1;
  const totalItems = actionsProposals?.meta?.pagination?.total || 0;

  return (
    <div className="base_container min-h-screen py-10">
      <section className="mb-12">
        <h2 className="text-7xl font-black">Proposals</h2>
      </section>

      <section>
        <ul
          role="list"
          className="grid grid-cols-1 gap-6 border-t border-green-400 py-6 lg:grid-cols-2 xl:grid-cols-3"
        >
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
