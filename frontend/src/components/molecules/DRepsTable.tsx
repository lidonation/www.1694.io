'use client';

import React from 'react';
import StatusChip from '../atoms/StatusChip';
import { useGetDRepsQuery } from '@/hooks/useGetDRepsQuery';
import {
  checkStatus,
  convertString,
  formatAsCurrency,
  handleCopyText,
  shortNumber,
} from '@/lib';
import {
  formatPercentChange,
  isVotingOptionView,
  liveStakeChangePercent,
  votingOptionLabel,
} from '@/lib/drepDisplay';
import { useScreenDimension } from '@/hooks';
import { Box, IconButton, Skeleton, Tooltip } from '@mui/material';
import Link from 'next/link';
import Pagination from './Pagination';
import CopyToClipBoard from '../atoms/svgs/CopyToClipBoardIcon';
import ArrowDownIcon from '../atoms/svgs/ArrowDownIcon';
import ArrowUpIcon from '../atoms/svgs/ArrowUpIcon';
import CrossIcon from '../atoms/svgs/CrossIcon';
import Typography from '@mui/material/Typography';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import DRepLogo from './DRepLogo';
import RecordsNotFound from '../atoms/RecordsNotFound';
import { useDRepNavigator } from '@/lib/lastDrepTabNavigation';

type DRepsTableProps = {
  query?: string;
  page?: number;
  sort?: string;
  order?: string;
  onChainStatus?: string;
  campaignStatus?: string;
  includeRetired?: string;
  type?: string;
};

export function isActive(latest_epoch_no: number, active_until: number) {
  if (typeof latest_epoch_no !== 'number' || typeof active_until !== 'number') {
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
  includeRetired,
  type,
}: DRepsTableProps) => {
  const navigateToDRepWithLastTab = useDRepNavigator();
  const { isMobile } = useScreenDimension();
  const { addSuccessAlert } = useGlobalNotifications();
  const { DReps, isDRepsLoading, isError } = useGetDRepsQuery(
    query,
    page,
    sort,
    order,
    onChainStatus,
    campaignStatus,
    includeRetired,
    type,
  );

  return (
    <div className="dreps-table-wrapper flex flex-col overflow-x-auto">
      <table className="dreps-table min-w-full">
        <thead className="mb-2">
          <tr className="overflow-x-auto bg-white text-left text-xl font-black text-nowrap">
            <th className="py-2">DRep</th>
            <th className="px-4 py-2">
              <div className="flex items-center">
                <span>Voting Power</span>
                {sort === 'voting_power' &&
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
                <span>Live Stake</span>
                {sort === 'live_stake' &&
                  (order === 'desc' ? (
                    <ArrowDownIcon width={20} height={20} color="black" />
                  ) : (
                    order === 'asc' && (
                      <ArrowUpIcon width={20} height={20} color="black" />
                    )
                  ))}
              </div>
            </th>
            <th className="py-2">
              <div className="flex items-center justify-end text-left">
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
            DReps.data.map((drep) => {
              const isVotingOption =
                drep?.type === 'voting_option' ||
                isVotingOptionView(drep?.view);
              const givenName =
                typeof drep?.given_name === 'string' && drep.given_name.trim()
                  ? drep.given_name.trim()
                  : null;
              const liveStakeChange = liveStakeChangePercent(
                drep.live_stake,
                drep.voting_power,
              );
              return (
                <tr
                  key={drep.view}
                  data-testid={`drep-id-${drep.view}`}
                  className={`text-left text-sm text-nowrap hover:bg-gray-50 ${drep.view}`}
                >
                  <td className="py-2.5">
                    <Box className="flex flex-row items-center gap-3">
                      {!isVotingOption && drep?.type !== 'scripted' && (
                        <DRepLogo
                          drepView={drep?.view}
                          metadata={drep?.metadata?.json_metadata}
                        />
                      )}

                      {isVotingOption ? (
                        <Link
                          className="flex items-center gap-4"
                          href={`/dreps/${drep?.view}`}
                          prefetch={false}
                          onClick={(e) => {
                            e.preventDefault();
                            navigateToDRepWithLastTab(drep?.view);
                          }}
                        >
                          <p className="font-medium hover:font-semibold">
                            {votingOptionLabel(drep?.view)}
                          </p>
                        </Link>
                      ) : (
                        <Box className="flex flex-nowrap items-center">
                          <Tooltip title="Copy DRep ID (CIP-129)">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleCopyText(drep?.view, addSuccessAlert)
                                }
                              >
                                <CopyToClipBoard width={18} height={18} />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Link
                            href={`/dreps/${drep?.view}`}
                            prefetch={false}
                            onClick={(e) => {
                              e.preventDefault();
                              navigateToDRepWithLastTab(drep?.view);
                            }}
                          >
                            <p className="hover:font-semibold">
                              {convertString(drep?.view, isMobile)}
                            </p>
                          </Link>
                        </Box>
                      )}

                      <Box className="flex flex-row items-center gap-1.5">
                        {/* Without a given name the ID above already names the DRep. */}
                        {!isVotingOption && givenName && (
                          <Tooltip title="DRep given name">
                            <Link
                              className="inline-flex"
                              href={`/dreps/${drep?.view}`}
                              prefetch={false}
                              onClick={(e) => {
                                e.preventDefault();
                                navigateToDRepWithLastTab(drep?.view);
                              }}
                            >
                              <span className="inline-block rounded-xl border border-black px-1.5 py-0.5 text-xs font-black text-black">
                                {givenName.length > 25
                                  ? `${givenName.slice(0, 25)}...`
                                  : givenName}
                              </span>
                            </Link>
                          </Tooltip>
                        )}

                        {isVotingOption ? (
                          <Tooltip
                            title="Predefined voting option, not an individual DRep"
                            disableFocusListener
                          >
                            <span>
                              <button className="flex shrink-0 gap-2 hover:cursor-default">
                                <StatusChip status="Voting Option" />
                              </button>
                            </span>
                          </Tooltip>
                        ) : (
                          <Tooltip
                            title="DRep onchain status"
                            disableFocusListener
                          >
                            <span>
                              <button className="flex shrink-0 gap-2 hover:cursor-default">
                                <StatusChip
                                  status={checkStatus(drep?.active)}
                                />
                                {drep.retired && (
                                  <StatusChip status={'Retired'} />
                                )}
                              </button>
                            </span>
                          </Tooltip>
                        )}

                        {drep.type === 'scripted' && (
                          <Tooltip title="Scripted DRep" disableFocusListener>
                            <span>
                              <button className="flex shrink-0 gap-2 hover:cursor-default">
                                <StatusChip status="Scripted" />
                              </button>
                            </span>
                          </Tooltip>
                        )}

                        {/* Voting options never cast votes, so no vote count. */}
                        {!isVotingOption &&
                          typeof drep.governance_vote_count === 'number' && (
                            <Tooltip title="Governance votes">
                              <span className="inline-block shrink-0 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-center text-xs font-normal text-nowrap text-black">
                                Votes: {drep.governance_vote_count}
                              </span>
                            </Tooltip>
                          )}
                      </Box>
                    </Box>
                  </td>

                  <td className="overflow-auto px-4 py-2">
                    {drep.voting_power !== null ? (
                      <Box className="flex w-full flex-nowrap items-center justify-start">
                        <Tooltip
                          title={`₳ ${formatAsCurrency(drep.voting_power)}`}
                        >
                          <Typography>
                            ₳ {shortNumber(drep.voting_power, 2)}
                          </Typography>
                        </Tooltip>
                      </Box>
                    ) : (
                      <p>-</p>
                    )}
                  </td>

                  <td className="overflow-auto px-2 py-2">
                    {drep.live_stake !== null &&
                    drep.live_stake !== undefined ? (
                      <Box className="flex w-full flex-row flex-nowrap items-center justify-start gap-1.5">
                        <Tooltip
                          title={`₳ ${formatAsCurrency(drep.live_stake)}`}
                        >
                          <Typography>
                            ₳ {shortNumber(drep.live_stake, 2)}
                          </Typography>
                        </Tooltip>
                        {liveStakeChange !== null && (
                          <Tooltip title="Change against the voting power snapshot">
                            <Typography
                              variant="body1"
                              className={`font-bolder ${liveStakeChange > 0 ? 'text-success' : 'text-extra_red'}`}
                            >
                              {formatPercentChange(liveStakeChange)}
                            </Typography>
                          </Tooltip>
                        )}
                      </Box>
                    ) : (
                      <p>-</p>
                    )}
                  </td>

                  <td className="px-4 py-2">
                    <p className="text-center">{drep.delegation_vote_count}</p>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={10} className="px-4 py-6 text-center">
                {!isError && (
                  <RecordsNotFound message="No DReps to show for now..." />
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
                                Oops!!!
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
            dataType="DReps"
          />
        </Box>
      )}
    </div>
  );
};

export default DRepsTable;
