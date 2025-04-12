'use client';

import ProposalCard from '@/components/molecules/ProposalCard';
import { useGetActionsProposalsQuery } from '@/hooks/useGetActionsProposalsQuery';
import React from 'react';

function page() {
  const { actionsProposals, isActionsProposalsLoading } =
    useGetActionsProposalsQuery();

  if (!isActionsProposalsLoading) console.log(actionsProposals);
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
          {!isActionsProposalsLoading &&
            actionsProposals?.data?.length > 0 &&
            actionsProposals?.data?.map((proposal, index) => (
              <li key={index}>
                <ProposalCard proposal={proposal} />
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

export default page;
