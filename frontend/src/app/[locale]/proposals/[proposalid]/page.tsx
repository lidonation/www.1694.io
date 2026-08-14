'use client';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import { useGetActionProposalQuery } from '@/hooks/useGetActionProposalQuery';
import { useParams } from 'next/navigation';
import React from 'react';
import ProposalIdentity from '@/components/proposals/ProposalIdentity';
import ProposalDetails from '@/components/proposals/ProposalDetails';
import ProposalComments from '@/components/proposals/ProposalComments';
import { Box } from '@mui/material';
import VoteResultsCard from '@/components/proposals/VoteResultsCard';
import { useGetActionProposalPollQuery } from '@/hooks/useGetActionProposalPollQuery';
import VotingSection from '@/components/proposals/VotingSection';
import { useWallet } from '@/context/globalContext';
import CatalystParticipation from '@/components/proposals/CatalystParticipation';
import { useUserParticipationQuery } from '@/hooks/useUserCatalystParticipationQuery';

function page() {
  const { proposalid } = useParams();
  const { actionProposal, isActionProposalLoading } = useGetActionProposalQuery(
    Number(proposalid),
  );
  const { poll, isPollLoading } = useGetActionProposalPollQuery(
    Number(proposalid),
  );
  const {
    wallet: { isConnected, isDRep },
  } = useWallet();
  const username =
    actionProposal?.data?.attributes?.creator?.data?.attributes
      ?.govtool_username || 'anonymous';
  const { data: proposalMetrics, isLoading } =
    useUserParticipationQuery(username);

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
            isPollLoading={isPollLoading}
          />

          <ProposalDetails
            proposal={actionProposal?.data}
            isProposalLoading={isActionProposalLoading}
          />

          <Box className="rounded-md bg-white p-6 shadow-sm">
            <CatalystParticipation
              metrics={proposalMetrics}
              isLoading={isLoading}
            />
          </Box>

          {isConnected && isDRep && <VotingSection poll={poll?.data} />}

          {poll?.data && (
            <Box
              id="vote-results"
              className="rounded-md bg-white p-6 shadow-sm"
            >
              <VoteResultsCard
                poll={poll?.data}
                isPollLoading={isPollLoading}
              />
            </Box>
          )}

          <ProposalComments proposal={actionProposal?.data} />
        </main>
      </section>
    </Box>
  );
}

export default page;
