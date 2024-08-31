'use client';

import React from 'react';
import StatusChip from '../atoms/StatusChip';
import { useGetDRepsQuery } from '@/hooks/useGetDRepsQuery';
import {
  convertString,
  formatAsCurrency,
  handleCopyText,
  shortNumber,
} from '@/lib';
import { useScreenDimension } from '@/hooks';
import { Box, IconButton, Skeleton, Tooltip } from '@mui/material';
import Button from '../atoms/Button';
import Link from 'next/link';
import HoverText from '../atoms/HoverText';
import Pagination from './Pagination';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CopyToClipBoard from '../atoms/svgs/CopyToClipBoardIcon';
import ArrowDownIcon from '../atoms/svgs/ArrowDownIcon';
import ArrowUpIcon from '../atoms/svgs/ArrowUpIcon';
import DatabaseNullIcon from '../atoms/svgs/DatabaseNullIcon';
import CrossIcon from '../atoms/svgs/CrossIcon';

type DRepsTableProps = {
  query?: string;
  page?: number;
  sort?: string;
  order?: string;
  onChainStatus?: string;
  campaignStatus?: string;
};
export function isActive(latest_epoch_no: number, active_until: number) {
  if (
    typeof latest_epoch_no !== 'number' ||
    typeof active_until !== 'number' ||
    active_until === null
  ) {
    return false;
  }
  return active_until > latest_epoch_no;
}
const DRepsTable = ({
  query,
  page,
  sort,
  order,
  onChainStatus,
  campaignStatus,
}: DRepsTableProps) => {
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const { replace } = useRouter();
  const { isMobile } = useScreenDimension();

  const { DReps, isDRepsLoading, isError } = useGetDRepsQuery(
    query,
    page,
    sort,
    order,
    onChainStatus,
    campaignStatus,
  );
  // Handle table pagination
  function moveToPage(targetPage: number) {
    const params = new URLSearchParams(searchParams);

    if (page !== targetPage) {
      params.set('page', targetPage.toString());
    }
    replace(`${pathName}?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function moveToFirstPage(firstPage: number) {
    moveToPage(firstPage);
  }

  function moveToLastPage(lastPage: number) {
    moveToPage(lastPage);
  }

  function moveToPreviousPage(previousPage: number) {
    moveToPage(previousPage);
  }

  function moveToNextPage(nextPage: number) {
    moveToPage(nextPage);
  }

  return (
    <div className="flex flex-col overflow-x-auto">
      <table className="min-w-full">
        <thead className="mb-2">
          <tr className="overflow-x-auto text-nowrap bg-white text-left text-xl font-black">
            <th className="px-4 py-2">Campaign</th>
            <th className="px-4 py-2">Drep Id</th>
            <th className="px-4 py-2">
              <div className="flex items-center">
                <span>Active Power</span>
                {sort === 'power' &&
                  (order === 'desc' ? (
                    <ArrowDownIcon width={20} height={20} color="black" />
                  ) : (
                    order === 'asc' && (
                      <ArrowUpIcon width={20} height={20} color="black" />
                    )
                  ))}
              </div>
            </th>
            <th className="px-4 py-2">
              <div className="flex items-center">
                <span>Delegators</span>
                {sort === 'delegators' &&
                  (order === 'desc' ? (
                    <ArrowDownIcon width={20} height={20} color="black" />
                  ) : (
                    order === 'asc' && (
                      <ArrowUpIcon width={20} height={20} color="black" />
                    )
                  ))}
              </div>
            </th>
            <th className="px-4 py-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {isDRepsLoading ? (
            <tr>
              <td colSpan={24} className="px-4 py-2 text-center">
                {Array.from({ length: 24 }).map((_, index) => (
                  <Skeleton height={45} key={index} />
                ))}
              </td>
            </tr>
          ) : DReps?.data && DReps?.data.length > 0 ? (
            DReps.data.map((drep) => (
              <tr
                key={drep.drep_hash_id}
                data-testid={`drep-id-${drep.view}`}
                className="text-nowrap text-left text-sm"
              >
                <td className="px-4 py-2">
                  {drep?.type === 'voting_option' ? (
                    <Box>
                      <Link
                        className="flex items-center gap-4"
                        href={`/dreps/${drep?.view}`}
                      >
                        <Button size="extraSmall" width={4}>
                          View
                        </Button>
                        <p className="font-medium hover:font-semibold">{drep?.view}</p>
                      </Link>
                    </Box>
                  ) : !!drep.drep_id ? (
                    <Box>
                      <Link
                        className="flex items-center gap-4"
                        href={`/dreps/${drep?.view}`}
                      >
                        <Button size="extraSmall" width={4}>
                          View
                        </Button>
                        <p className="font-medium hover:font-semibold">claimed</p>
                      </Link>
                      {/* Disabled due to model changes */}
                      {/* <p className="font-medium">{drep?.drep_name}</p> */}
                    </Box>
                  ) : (
                    <Box className="flex items-center gap-4">
                      <Link href={`/dreps/workflow/profile/new`}>
                        <Button size="extraSmall" width={4}>
                          Claim
                        </Button>
                      </Link>
                      <Link href={`/dreps/${drep.view}`}>
                        <p className="font-medium hover:font-semibold">unclaimed</p>
                      </Link>
                    </Box>
                  )}
                </td>

                <td className="flex items-center px-4 py-2">
                  <Tooltip title="Copy DRep ID">
                    <IconButton
                      size="small"
                      onClick={() => handleCopyText(drep.view)}
                    >
                      <CopyToClipBoard width={18} height={18} />
                    </IconButton>
                  </Tooltip>
                  <Link href={`/dreps/${drep.view}`}>
                    <p className="hover:font-semibold">
                      {convertString(drep.view, isMobile)}
                    </p>
                  </Link>
                </td>

                <td className="max-w-11 overflow-auto px-4 py-2">
                  <HoverText
                    shortText={shortNumber(drep.amount, 2)}
                    longText={formatAsCurrency(drep.amount)}
                  />
                </td>

                <td className="px-4 py-2">
                  <p className="text-center">{drep.delegation_vote_count}</p>
                </td>

                <td className="px-4 py-2">
                  <StatusChip
                    status={
                      isActive(drep.latest_epoch_no, drep.active_until)
                        ? 'Active'
                        : 'Inactive'
                    }
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} className="px-4 py-6 text-center">
                {!isError && (
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex w-full flex-col items-center rounded-lg border-2 border-dashed border-gray-300 p-12 hover:border-gray-400">
                      <DatabaseNullIcon width={60} height={50} />
                      <span className="mt-2 block text-sm font-semibold text-gray-500">
                        No DReps to show for now...
                      </span>
                    </div>
                  </div>
                )}
                {isError && (
                  <div className="mx-auto">
                    <div className="border-l-8 border-red-700 bg-red-50">
                      <div className="flex items-center">
                        <div className="p-2">
                          <div className="flex items-center">
                            <div className="ml-2">
                              <CrossIcon
                                color="#b91c1c"
                                width={30}
                                height={30}
                              />
                            </div>
                            <div className="flex flex-col py-4">
                              <p className="px-3 text-left text-lg font-bold text-red-700">
                                Opps!!!
                              </p>
                              <p className="px-3 text-sm font-semibold text-red-700">
                                An error occurred while fetching the data.
                                Please refresh the page or try again later
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!isDRepsLoading && DReps?.data && DReps?.data.length > 0 && (
        <Box className="mt-6 flex justify-end">
          <Pagination
            currentPage={DReps.currentPage}
            totalPages={DReps.totalPages}
            totalItems={DReps.totalItems}
            moveToFirstPage={moveToFirstPage}
            moveToLastPage={moveToLastPage}
            moveToPreviousPage={moveToPreviousPage}
            moveToNextPage={moveToNextPage}
          />
        </Box>
      )}
    </div>
  );
};

export default DRepsTable;
