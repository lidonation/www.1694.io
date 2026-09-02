'use client';
import React from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ProposalIdentityLoader from '../Loaders/ProposalIdentityLoader';
import Link from 'next/link';
import { Box } from '@mui/material';
import { formatNumberTimeToReadable, scrollToElement } from '@/lib';
import VoteResultsCard from './VoteResultsCard';

type ProposalIdentityProps = {
  proposal: any;
  isProposalLoading?: boolean;
  poll: any;
  isPollLoading?: boolean;
};

function ProposalIdentity({
  proposal,
  isProposalLoading,
  poll,
  isPollLoading,
}: ProposalIdentityProps) {
  if (isProposalLoading) {
    return <ProposalIdentityLoader />;
  }

  const title =
    proposal?.attributes?.bd_proposal_detail?.data?.attributes?.proposal_name ||
    '_';
  const author =
    proposal?.attributes?.creator?.data?.attributes.govtool_username;
  const category =
    proposal?.attributes?.bd_psapb?.data?.attributes?.type_name?.data
      ?.attributes?.type_name || '-';
  const comments = proposal?.attributes?.prop_comments_number || 0;

  return (
    <Box className="rounded-md bg-white p-6 shadow-sm">
      <Box className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <Box className="mt-2 flex flex-col items-center text-sm text-gray-600 sm:flex-row">
          {author && (
            <p className="font-medium">
              Author: <span className="text-base">@{author}</span>
            </p>
          )}
          <span className="mx-3 text-gray-400">•</span>
          <p className="">
            Proposed on:{' '}
            <span className="text-base">
              {formatNumberTimeToReadable(proposal?.attributes?.createdAt)}
            </span>
          </p>
          <span className="mx-3 text-gray-400">•</span>
          <p>
            Category: <span className="text-base">{category}</span>
          </p>
        </Box>
      </Box>

      <Box className="pt-2">
        <VoteResultsCard
          poll={poll}
          showFullDetails={false}
          isPollLoading={isPollLoading || isProposalLoading}
        />
      </Box>

      <Box className="flex flex-wrap items-center gap-6 text-sm">
        <Box className="flex items-center gap-1 text-gray-700">
          <AccessTimeIcon fontSize="small" />
          <span>
            Last Edited:{' '}
            {formatNumberTimeToReadable(proposal?.attributes?.updatedAt)}
          </span>
        </Box>
        <Link
          href="#comments"
          onClick={(event) => scrollToElement(event, 'comments')}
          className="hover:text-primary-300 flex items-center gap-1 text-gray-700"
        >
          <ChatBubbleOutlineIcon fontSize="small" />
          <span>{comments} Comments</span>
        </Link>
        <Box className="flex items-center gap-1 text-gray-700">
          <p>Status</p>
          <span className="text-primary-300 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium">
            {proposal?.attributes?.is_active ? 'Active' : 'Inactive'}
          </span>
        </Box>
      </Box>
    </Box>
  );
}

export default ProposalIdentity;
