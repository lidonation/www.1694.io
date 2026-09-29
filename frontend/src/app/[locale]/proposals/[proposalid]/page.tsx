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
  const { actionProposal, isActionProposalLoading, isActionProposalError } =
    useGetActionProposalQuery(Number(proposalid));
  const { poll, isPollLoading, isPollError } = useGetActionProposalPollQuery(
    Number(proposalid),
  );
  const proposalName =
    actionProposal?.data?.attributes?.bd_proposal_detail?.data?.attributes
      ?.proposal_name;
  const breadcrumbLabel = isActionProposalLoading
    ? '...'
    : proposalName || 'Proposal unavailable';
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
            label: breadcrumbLabel,
            href: `/proposals/${proposalid}`,
          },
        ]}
      />
      {(isActionProposalError || isPollError) &&
        !isActionProposalLoading &&
        !isPollLoading && (
          <Box className="base_container w-full pt-4">
            <Box className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Proposal details are currently unavailable. The list page still
              works; please try again later.
            </Box>
          </Box>
        )}
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
