'use client';

import React from 'react';
import StatusChip from '../atoms/StatusChip';
import { useGetDRepsQuery } from '@/hooks/useGetDRepsQuery';
import { convertString, formatAsCurrency, shortNumber } from '@/lib';
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

type DRepsTableProps = {
  query?: string;
  page?: number;
  sort?: string;
  order?: string;
  onChainStatus?: string;
  campaignStatus?: string;
};

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

  const { DReps, isDRepsLoading } = useGetDRepsQuery(
    query,
    page,
    sort,
    order,
    onChainStatus,
    campaignStatus,
  );

  function isActive(latest_epoch_no: number, active_until: number) {
    if (
      typeof latest_epoch_no !== 'number' ||
      typeof active_until !== 'number' ||
      active_until === null
    ) {
      return false;
    }
    return active_until > latest_epoch_no;
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
                <span>Live Power</span>
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
          ) : DReps.data && DReps.data.length > 0 ? (
            DReps.data.map((drep) => (
              <tr
                key={drep.drep_hash_id}
                data-testid={`drep-id-${drep.view}`}
                className="text-nowrap text-left text-sm"
              >
                <td className="px-4 py-2">
                  {!!drep.drep_id ? (
                    <Box className="flex items-center gap-4">
                      <Link href={`/dreps/${drep.view}`}>
                        <Button size="extraSmall" width={4}>
                          View
                        </Button>
                      </Link>
                      <p className="font-medium">{drep.drep_name}</p>
                    </Box>
                  ) : (
                    <Box className="flex items-center gap-4">
                      <Link href={`/dreps/workflow/profile/new`}>
                        <Button size="extraSmall" width={4}>
                          Claim
                        </Button>
                      </Link>
                      <p className="font-medium">unclaimed</p>
                    </Box>
                  )}
                </td>

                <td className="flex items-center px-4 py-2">
                  <Tooltip title="Copy DRep ID">
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(drep.view)}
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
              <td colSpan={10} className="text-center">
                No DReps to show for now...
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {!isDRepsLoading && (
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
