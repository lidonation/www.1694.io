import React from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ShareIcon from '@mui/icons-material/Share';
import ProposalIdentityLoader from '../Loaders/ProposalIdentityLoader';
import Link from 'next/link';

type ProposalIdentityProps = {
  proposal: any;
  isProposalLoading?: boolean;
};

function ProposalIdentity({
  proposal,
  isProposalLoading,
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
    <div className="rounded-md bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="mt-2 flex items-center text-sm text-gray-700">
            {author && (
              <span className="mr-3 font-medium">Author: @{author}</span>
            )}
            <span className="text-gray-400">•</span>
            <span className="mx-3">
              Proposed on:{' '}
              {new Date(proposal?.attributes?.createdAt).toLocaleDateString(
                'en-GB',
              )}
            </span>
            <span className="text-gray-400">•</span>
            <span className="mx-3">Category: {category}</span>
          </div>
        </div>
        <div>
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-primary-300">
            {proposal?.attributes?.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 border-t py-3 text-sm">
        <div className="flex items-center gap-1 text-gray-700">
          <AccessTimeIcon fontSize="small" />
          <span>
            Last Edited:{' '}
            {new Date(proposal?.attributes?.updatedAt).toLocaleDateString(
              'en-GB',
            )}
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-700">
          <ThumbUpIcon fontSize="small" />
          <span>3 Upvotes</span>
        </div>
        <Link href="#comments" className="flex items-center gap-1 text-gray-700">
          <ChatBubbleOutlineIcon fontSize="small" />
          <span>{comments} Comments</span>
        </Link>
        <button className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-sm font-medium text-gray-700 transition hover:bg-gray-100">
          <ShareIcon fontSize="small" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
}

export default ProposalIdentity;
