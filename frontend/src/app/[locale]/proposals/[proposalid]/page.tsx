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

function ProposalDetailPage() {
  const { proposalid } = useParams();
  const { actionProposal, isActionProposalLoading, isActionProposalError } =
    useGetActionProposalQuery(Number(proposalid));
  const { poll, isPollLoading, isPollError } = useGetActionProposalPollQuery(
    Number(proposalid),
  );
  const proposal = actionProposal?.data;
  const proposalName =
    proposal?.attributes?.bd_proposal_detail?.data?.attributes?.proposal_name;
  const breadcrumbLabel = isActionProposalLoading
    ? '...'
    : proposalName || 'Proposal unavailable';
  const isProposalUnavailable =
    !isActionProposalLoading && (isActionProposalError || !proposal);
  const {
    wallet: { isConnected, isDRep },
  } = useWallet();
  const username =
    proposal?.attributes?.creator?.data?.attributes?.govtool_username || '';
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
      {isProposalUnavailable && (
        <Box className="base_container w-full pt-4">
          <Box className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Proposal details are currently unavailable. The list page still
            works; please try again later.
          </Box>
        </Box>
      )}
      {!isProposalUnavailable && isPollError && !isPollLoading && proposal && (
        <Box className="base_container w-full pt-4">
          <Box className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Poll results are currently unavailable. Proposal details remain
            available below.
          </Box>
        </Box>
      )}
      <section className="base_container flex h-full min-h-screen w-full py-4">
        <main className="w-full space-y-6">
          {!isProposalUnavailable && (
            <ProposalIdentity
              proposal={proposal}
              isProposalLoading={isActionProposalLoading}
              poll={poll?.data}
              isPollLoading={isPollLoading}
            />
          )}

          {proposal && (
            <>
              <ProposalDetails
                proposal={proposal}
                isProposalLoading={isActionProposalLoading}
              />

              <Box className="rounded-md bg-white p-6 shadow-sm">
                <CatalystParticipation
                  metrics={proposalMetrics}
                  isLoading={isLoading}
                />
              </Box>

              {isConnected && isDRep && poll?.data && (
                <VotingSection poll={poll.data} />
              )}

              {poll?.data && (
                <Box
                  id="vote-results"
                  className="rounded-md bg-white p-6 shadow-sm"
                >
                  <VoteResultsCard
                    poll={poll.data}
                    isPollLoading={isPollLoading}
                  />
                </Box>
              )}

              <ProposalComments proposal={proposal} />
            </>
          )}
        </main>
      </section>
    </Box>
  );
}

export default ProposalDetailPage;
