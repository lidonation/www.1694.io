import React, { useEffect, useState } from 'react';
import StatusChip from '../atoms/StatusChip';
import { useGetDRepsQuery } from '@/hooks/useGetDRepsQuery';
import HoverChip from '../atoms/HoverChip';
import { useRouter } from 'next/navigation';
import { convertString } from '@/lib';
import { useScreenDimension } from '@/hooks';
import { Skeleton } from '@mui/material';

const DRepsTable = ({ searchQuery }) => {
  const router = useRouter();
  const { isMobile } = useScreenDimension();
  const { DReps, isDRepsLoading } = useGetDRepsQuery();
  //will be later changed to filter by drep name
  const filteredDreps =
    DReps &&
    DReps.length > 0 &&
    DReps.filter((drep) =>
      drep.view.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  function isActive(epoch_no: number, active_until: number) {
    return active_until > epoch_no;
  }
  function statusChecker(deposit: number) {
    if (deposit > 0) {
      return 'Verified';
    } else {
      return 'Not registered';
    }
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="mb-2">
        <tr className="overflow-x-auto text-nowrap bg-white text-left text-xl font-black">
          <th className="px-4 py-2">
            Campaign
          </th>

          <th className="px-4 py-2">Drep Id</th>
          {/*<th className="px-4 py-2">Epoch</th>*/}

          <th className="px-4 py-2">Live Power</th>
          {/*<th className="px-4 py-2">Live Power</th>*/}
          <th className="px-4 py-2">Delegators</th>
          <th className="px-4 py-2">Status</th>
          {/*<th colSpan={3} className="px-4 py-2">*/}
          {/*  Actions*/}
          {/*</th>*/}
        </tr>
        </thead>
        <tbody>
        {isDRepsLoading ? (
            <tr>
              <td colSpan={10} className="text-center">
              {
                Array.from({ length: 10 }).map((_, index) => (
                  <Skeleton height={40} key={index}/>
                ))
              }
              </td>
            </tr>
          ) : filteredDreps && filteredDreps.length > 0 ? (
            filteredDreps.map((drep) => (
              <tr
                key={drep.drep_hash_id}
                data-testid={`drep-id-${drep.view}`}
                className="text-nowrap text-left text-sm"
              >
                {/*drep_name*/}
                <td className="px-4 py-2 flex gap-2.5 flex-nowrap">
                  {drep?.drep_name || 'Unclaimed'}
                  <StatusChip status={statusChecker(drep.deposit)} />
                </td>
                {/*ID*/}
                <td className="px-4 py-2">
                  {convertString(drep.view, isMobile)}
                </td>

                {/*epoch_no*/}
                {/*<td className="px-4 py-2">{drep.epoch_no}</td>*/}

                {/*Campaign Status*/}
                {/*<td className="px-4 py-2">*/}
                {/*  <StatusChip status={statusChecker(drep.deposit)} />*/}
                {/*</td>*/}

                {/*active voting power*/}
                <td className="px-4 py-2">₳ {drep.amount}</td>

                {/*upcoming voting power*/}
                {/*<td className="px-4 py-2">₳ {drep.amount}</td>*/}

                {/*delegators*/}
                <td className="px-4 py-2">
                  {drep.delegation_vote_count}
                </td>

                {/*Drep status*/}
                <td className="px-4 py-2">
                  <StatusChip
                      status={
                        isActive(drep.epoch_no, drep.active_until)
                            ? 'Active'
                            : 'Inactive'
                      }
                  />
                </td>

                {/*actions*/}
                {/*<td className="px-4 py-2">*/}
                {/*  <div className="flex space-x-2">*/}
                {/*    <HoverChip*/}
                {/*      text="View Profile"*/}
                {/*      handleClick={() => router.push(`/dreps/${drep.view}`)}*/}
                {/*    >*/}
                {/*      <img src="/svgs/link.svg" alt="" />*/}
                {/*    </HoverChip>*/}
                {/*    <HoverChip*/}
                {/*      text="Link DRep"*/}
                {/*      handleClick={*/}
                {/*        () => console.log('linking drep', drep.view)*/}
                {/*        // router.push(`/drep/${drep.id}`)*/}
                {/*      }*/}
                {/*    >*/}
                {/*      <img src="/svgs/user-circle.svg" alt="" />*/}
                {/*    </HoverChip>*/}
                {/*    <HoverChip*/}
                {/*      text="Claim DRep Profile"*/}
                {/*      handleClick={() => router.push(`/dreps/${drep.view}`)}*/}
                {/*    >*/}
                {/*      <img src="/svgs/medal.svg" alt="" />*/}
                {/*    </HoverChip>*/}
                {/*  </div>*/}
                {/*</td>*/}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} className="text-center">
                No Dreps to show for now
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DRepsTable;
