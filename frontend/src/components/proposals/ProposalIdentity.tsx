import React from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ShareIcon from '@mui/icons-material/Share';
import ProposalIdentityLoader from '../Loaders/ProposalIdentityLoader';
import Link from 'next/link';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { Box } from '@mui/material';
import { formatNumberTimeToReadable } from '@/lib';

type ProposalIdentityProps = {
  proposal: any;
  isProposalLoading?: boolean;
  poll: any;
};

function ProposalIdentity({
  proposal,
  isProposalLoading,
  poll,
}: ProposalIdentityProps) {
  const { addSuccessAlert } = useGlobalNotifications();
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
  const totalVotes =
    (poll && poll[0]?.attributes?.poll_yes + poll[0]?.attributes?.poll_no) || 0;

  const copyProposalUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    addSuccessAlert('Copied to clipboard');
  };

  return (
    <Box className="rounded-md bg-white p-6 shadow-sm">
      <Box className="mb-4 flex items-center justify-between flex-wrap">
        <Box>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <Box className="mt-2 flex flex-col items-center text-sm text-gray-700 sm:flex-row">
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
        <Box>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-primary-300">
            {proposal?.attributes?.is_active ? 'Active' : 'Inactive'}
          </span>
        </Box>
      </Box>

      <Box className="flex flex-wrap items-center gap-6 border-t py-3 text-sm">
        <Box className="flex items-center gap-1 text-gray-700">
          <AccessTimeIcon fontSize="small" />
          <span>
            Last Edited:{' '}
            {formatNumberTimeToReadable(proposal?.attributes?.updatedAt)}
          </span>
        </Box>
        <Box className="flex items-center gap-1 text-gray-700">
          <ThumbUpIcon fontSize="small" />
          <span>{totalVotes} Upvotes</span>
        </Box>
        <Link
          href="#comments"
          className="flex items-center gap-1 text-gray-700 hover:text-primary-300"
        >
          <ChatBubbleOutlineIcon fontSize="small" />
          <span>{comments} Comments</span>
        </Link>
        <button
          onClick={copyProposalUrl}
          className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-sm font-medium text-gray-700 transition hover:text-primary-300"
        >
          <ShareIcon fontSize="small" />
          <span>Share</span>
        </button>
      </Box>
    </Box>
  );
}

export default ProposalIdentity;
