'use client';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import { useGetActionProposalQuery } from '@/hooks/useGetActionProposalQuery';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import ProposalIdentity from '@/components/proposals/ProposalIdentity';
import ProposalDetails from '@/components/proposals/ProposalDetails';
import ProposalComments from '@/components/proposals/ProposalComments';
import { useGetActionProposalCommentsQuery } from '@/hooks/useGetActionProposalCommentsQuery';
import { Box } from '@mui/material';

function page() {
  const { proposalid } = useParams();
  const { actionProposal, isActionProposalLoading } = useGetActionProposalQuery(
    Number(proposalid),
  );
  const { comments, isCommentsLoading } = useGetActionProposalCommentsQuery(
    Number(proposalid),
  );

  return (
    <Box>
      <BreadCrumbs
        crumbs={[
          {
            label: 'Proposals',
            href: `/proposals`,
          },
          {
            label: `${
              isActionProposalLoading
                ? '...'
                : actionProposal?.data?.attributes?.bd_proposal_detail?.data
                    ?.attributes?.proposal_name
            }`,
            href: `/proposals/${proposalid}`,
          },
        ]}
      />
      <section className="base_container py-4 flex h-full min-h-screen w-full">
        <main className="w-full space-y-6">
          <ProposalIdentity
            proposal={actionProposal?.data}
            isProposalLoading={isActionProposalLoading}
          />

          <ProposalDetails
            proposal={actionProposal?.data}
            isProposalLoading={isActionProposalLoading}
          />

          <ProposalComments
            proposal={actionProposal?.data}
            comments={comments}
            isCommentsLoading={isCommentsLoading}
          />
        </main>
      </section>
    </Box>
  );
}

export default page;
