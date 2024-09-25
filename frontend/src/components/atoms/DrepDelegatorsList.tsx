import { useCardano } from '@/context/walletContext';
import { useScreenDimension } from '@/hooks';
import {
  convertString,
  formatAsCurrency,
  formattedAda,
  lovelaceToAda,
} from '@/lib';
import React, { useEffect, useState } from 'react';
import HoverText from './HoverText';
import { useGetDrepDelegators } from '@/hooks/useGetDrepDelegatorsQuery';
import { Box, Skeleton } from '@mui/material';
import Pagination from '../molecules/Pagination';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

const DrepDelegatorslist = ({ voterId }: { voterId: string }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { latestEpoch } = useCardano();
  const { isMobile, screenWidth } = useScreenDimension();
  const searchParams = useSearchParams();

  useEffect(() => {
    setCurrentPage(Number(searchParams.get('page') || 1));
  }, [searchParams]);

  const { Delegators, isDelegatorsLoading } = useGetDrepDelegators(
    voterId,
    currentPage,
  );

  return (
    <div className="w-full">
      <p className="text-3xl font-bold">Delegators</p>
      {isDelegatorsLoading && (
        <div className="px-1">
          {Array.from({ length: 24 }).map((_, index) => (
            <Skeleton height={80} key={index} />
          ))}
        </div>
      )}
      {!isDelegatorsLoading && Delegators.data.length > 0 && (
        <div className="flex flex-col overflow-x-auto">
          {Delegators.data.map((delegator, index) => {
            return (
              <div className="flex w-full flex-col" key={index}>
                <div className="flex w-full flex-row items-center justify-between text-nowrap py-4">
                  <div className="flex w-40 shrink-0 flex-col lg:w-60">
                    <p className="font-bold">
                      Epoch {delegator?.delegationEpoch}{' '}
                      {delegator?.delegationEpoch == latestEpoch && '(actual)'}
                    </p>
                    <Link
                      prefetch={false}
                      href={
                        delegator.stakeAddress
                          ? `/voters/${delegator?.stakeAddress}`
                          : '#'
                      }
                    >
                      {convertString(
                        delegator.stakeAddress,
                        isMobile || screenWidth < 1024,
                      )}
                    </Link>
                  </div>

                  <div className="flex w-40 shrink-0 flex-col items-center justify-start">
                    <p className="font-bold">Active Stake</p>
                    <div>
                      <HoverText
                        shortText={formattedAda(delegator?.votingPower, 2)}
                        longText={formatAsCurrency(
                          lovelaceToAda(delegator?.votingPower),
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex w-40 shrink-0 flex-col items-center justify-start">
                    <p className="font-bold">Epoch</p>
                    <p> {delegator.delegationEpoch}</p>
                  </div>

                  <div className="flex max-w-40 shrink-0 flex-col items-start justify-start">
                    <p className="font-bold">Actions</p>
                    <div className="flex items-center gap-2">
                      <ViewProfileAction toStakeKey={delegator.stakeAddress} />
                    </div>
                  </div>
                </div>
                <hr className="w-full border" />
              </div>
            );
          })}
        </div>
      )}
      {!isDelegatorsLoading && Delegators.data.length < 1 && (
        <p className="text-center">No delegators to show</p>
      )}

      {!isDelegatorsLoading &&
        Delegators?.data &&
        Delegators?.data.length > 0 && (
          <Box className="mt-6 flex justify-end">
            <Pagination
              currentPage={Delegators.currentPage}
              totalPages={Delegators.totalPages}
              totalItems={Delegators.totalItems}
              dataType="Delegators"
            />
          </Box>
        )}
    </div>
  );
};

export default DrepDelegatorslist;
