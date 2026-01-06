import { useScreenDimension } from '@/hooks';
import {
  convertString,
  formatAsCurrency,
  formattedAda,
  handleCopyText,
  lovelaceToAda,
  shortNumber,
} from '@/lib';
import React, { useEffect, useState } from 'react';
import { Box, IconButton, Skeleton, Tooltip, Typography } from '@mui/material';
import Pagination from '../molecules/Pagination';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ListSort from '../molecules/ListSort';
import CopyToClipBoardIcon from './svgs/CopyToClipBoardIcon';
import ArrowDownIcon from './svgs/ArrowDownIcon';
import ArrowUpIcon from './svgs/ArrowUpIcon';
import { useGetDRepDelegatorsQuery } from '@/hooks/useGetDRepDelegators';
import RecordsNotFound from './RecordsNotFound';

const ViewProfileAction = ({ toStakeKey }: { toStakeKey: string }) => {
  return (
    <Link prefetch={false} href={toStakeKey ? `/voters/${toStakeKey}` : '#'}>
      <div className="flex w-fit flex-row items-center gap-2 rounded-full bg-gray-200 px-3 py-1 text-sm">
        <img src="/svgs/eye.svg" alt="View Profile" />
        <p>View Profile</p>
      </div>
    </Link>
  );
};

const DRepDelegators = ({ voterId }: { voterId: string }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState(undefined);
  const [order, setOrder] = useState(undefined);
  const { isMobile, screenWidth } = useScreenDimension();
  const searchParams = useSearchParams();

  useEffect(() => {
    setCurrentPage(Number(searchParams.get('page') || 1));
    setSort(searchParams.get('sort') || null);
    setOrder(searchParams.get('order') || null);
  }, [searchParams]);

  const { Delegators, isDelegatorsLoading } = useGetDRepDelegatorsQuery(
    voterId,
    currentPage,
    null,
    sort,
    order,
  );

  return (
    <Box className="flex w-full flex-col bg-white p-5">
      <Box className="flex w-full items-center justify-between pr-2">
        <p className="text-3xl font-bold">Delegators</p>
        <ListSort
          tableType="Delegators"
          sortOptions={[
            {
              category: 'Voting Power',
              options: [
                { label: 'Highest to Lowest', value: 'power-desc' },
                { label: 'Lowest to Highest', value: 'power-asc' },
              ],
            },
            {
              category: 'Epoch',
              options: [
                { label: 'Highest to Lowest', value: 'epoch-desc' },
                { label: 'Lowest to Highest', value: 'epoch-asc' },
              ],
            },
          ]}
        />
      </Box>
      <Box className="my-5 overflow-x-auto rounded-md border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left rtl:text-right">
          <thead className="mb-2 whitespace-nowrap bg-gray-50 text-xl">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-base font-semibold text-gray-900"
              >
                Stake Address
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-base font-semibold text-gray-900"
              >
                <div className="flex items-center">
                  <span>Voting Power</span>
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
              <th
                scope="col"
                className="px-4 py-3 text-base font-semibold text-gray-900"
              >
                <div className="flex items-center">
                  <span>Epoch</span>
                  {sort === 'epoch' &&
                    (order === 'desc' ? (
                      <ArrowDownIcon width={20} height={20} color="black" />
                    ) : (
                      order === 'asc' && (
                        <ArrowUpIcon width={20} height={20} color="black" />
                      )
                    ))}
                </div>
              </th>
              <th
                scope="col"
                className="py-3 pl-4 text-base font-semibold text-gray-900"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isDelegatorsLoading && (
              <tr>
                <td colSpan={24} className="px-4 py-3">
                  {Array.from({ length: 24 }).map((_, index) => (
                    <Skeleton height={60} key={index} />
                  ))}
                </td>
              </tr>
            )}
            {!isDelegatorsLoading && !Delegators?.data?.length && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  <RecordsNotFound message="No Delegators found for this DRep." />
                </td>
              </tr>
            )}
            {!isDelegatorsLoading &&
              Delegators?.data?.length > 0 &&
              Delegators?.data.map((delegator) => (
                <tr
                  key={delegator.stakeAddress}
                  className="w-full text-nowrap bg-white transition-all hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium">
                    <div className="group flex items-center">
                      <Link
                        prefetch={false}
                        href={
                          delegator?.stakeAddress
                            ? `/voters/${delegator?.stakeAddress}`
                            : '#'
                        }
                        className="shrink-0"
                      >
                        {convertString(
                          delegator?.stakeAddress,
                          isMobile || screenWidth < 1024,
                        )}
                      </Link>
                      <div className="invisible group-hover:visible">
                        <Tooltip title="Copy stake address">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleCopyText(delegator?.stakeAddress)
                              }
                            >
                              <CopyToClipBoardIcon width={17} height={17} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </div>
                    </div>
                  </td>
                  <td className="flex w-full flex-nowrap items-center justify-start px-4 py-3">
                    <Tooltip
                      title={
                        `₳ ${shortNumber(delegator?.votingPower, 2)}`}
                    >
                      <Typography>
                        ₳ {shortNumber(delegator?.votingPower, 2)}                        
                      </Typography>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3">
                    {' '}
                    <p> {delegator?.delegationEpoch}</p>
                  </td>
                  <td className="min-w-44 py-3 pl-4">
                    <ViewProfileAction toStakeKey={delegator.stakeAddress} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Box>
      {!isDelegatorsLoading &&
        Delegators?.data &&
        Delegators?.data.length > 0 && (
          <Box className="flex justify-end">
            <Pagination
              currentPage={Delegators.currentPage}
              totalPages={Delegators.totalPages}
              totalItems={Delegators.totalItems}
              dataType="Delegators"
            />
          </Box>
        )}
    </Box>
  );
};

export default DRepDelegators;
