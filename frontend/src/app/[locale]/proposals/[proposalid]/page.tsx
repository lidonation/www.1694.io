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
import VoteResultsCard from '@/components/proposals/VoteResultsCard';
import { useGetActionProposalPollQuery } from '@/hooks/useGetActionProposalPollQuery';
import VotingSection from '@/components/proposals/VotingSection';

function page() {
  const { proposalid } = useParams();
  const { actionProposal, isActionProposalLoading } = useGetActionProposalQuery(
    Number(proposalid),
  );
  const { comments, isCommentsLoading } = useGetActionProposalCommentsQuery(
    Number(proposalid),
  );
  const { poll, isPollLoading } = useGetActionProposalPollQuery(Number(proposalid));

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
      <section className="base_container flex h-full min-h-screen w-full py-4">
        <main className="w-full space-y-6">
          <ProposalIdentity
            proposal={actionProposal?.data}
            isProposalLoading={isActionProposalLoading}
            poll={poll?.data}
          />

          <ProposalDetails
            proposal={actionProposal?.data}
            isProposalLoading={isActionProposalLoading}
          />

          <VotingSection/>

          <VoteResultsCard poll={poll?.data} />

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
