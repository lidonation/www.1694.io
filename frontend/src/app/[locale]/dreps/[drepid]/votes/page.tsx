'use client';
import { Box } from '@mui/material';
import { useParams, useSearchParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import Loading from '../loading';
import { useGetDRepGovActionsVotesQuery } from '@/hooks/useGetDRepGovActionsVotesQuery';
import { GovActionVoteCard } from '@/components/dreps/votes/GovActionVoteCard';
import Pagination from '@/components/molecules/Pagination';
import RecordsNotFound from '@/components/atoms/RecordsNotFound';

function page() {
  const { drepid } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const searchParams = useSearchParams();

  useEffect(() => {
    setCurrentPage(Number(searchParams.get('page') || 1));
  }, [searchParams]);

  const { govActions, isGovActionsLoading } = useGetDRepGovActionsVotesQuery(
    drepid.toString(),
    currentPage,
    10,
  );

  if (isGovActionsLoading) {
    return <Loading />;
  }

  return (
    <Box className="min-h-screen bg-white p-5">
      <h2 className="text-3xl font-bold">Voting History</h2>
      <Box className="my-5">
        {govActions && govActions?.data?.length > 0 ? (
          <div className="flex flex-col gap-3">
            {govActions.data.map((action) => (
              <GovActionVoteCard
                key={action.gov_action_proposal_id}
                action={action}
              />
            ))}
          </div>
        ) : (
          <RecordsNotFound message="No governance actions found related to this DRep." />
        )}
      </Box>
      {!isGovActionsLoading &&
        govActions?.data &&
        govActions?.data.length > 0 && (
          <Box className="flex justify-end">
            <Pagination
              currentPage={govActions.currentPage}
              totalPages={govActions.totalPages}
              totalItems={govActions.totalItems}
              dataType="Governance Actions"
            />
          </Box>
        )}
    </Box>
  );
}

export default page;
