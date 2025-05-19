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
      <Box className="my-5 overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        <Box className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="hidden w-48 px-4 py-3 text-left text-sm font-semibold text-gray-900 md:table-cell">
                  Date
                </th>
                <th className="px-3 py-3 text-left text-sm font-semibold text-gray-900 md:px-4">
                  Governance Action
                </th>
                <th className="w-20 px-3 py-3 text-right text-sm font-semibold text-gray-900 md:w-32 md:px-4">
                  Vote
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {govActions && govActions?.data?.length > 0 ? (
                govActions?.data?.map((action) => (
                  <GovActionVoteCard
                    key={action.gov_action_proposal_id}
                    action={action}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    <RecordsNotFound message="No governance actions found related to this DRep." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
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
