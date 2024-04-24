"use client";
import React from "react";
import StatusChip from "../atoms/StatusChip";
import { useGetDRepsQuery } from "@/hooks/useGetDRepsQuery";
import HoverChip from "../atoms/HoverChip";

const DRepsTable = ({searchQuery}) => {
  const { DReps, isDRepsLoading } = useGetDRepsQuery();
  //will be later changed to filter by drep name
  const filteredDreps = DReps && DReps.filter(drep =>
    drep.view.toLowerCase().includes(searchQuery.toLowerCase())
  );
  function isActive(epoch_no:number, active_until:number){
    return active_until>epoch_no
  }
  function statusChecker(deposit:number) {
    if (deposit > 0) {
        return 'Verified';
    } else {
        return 'Not registered';
    }
}

  function convertString(inputString:string) {
    if (inputString.length <= 10) {
        return inputString; // If the string is too short, no replacement is needed
    }

    return inputString.slice(0, 5) + '.......'+ inputString.slice(-5);}
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-pure-white text-left text-2xl font-black text-nowrap overflow-x-auto">
            <th className="px-4 py-2">DRep Id</th>
            <th className="px-4 py-2">Epoch</th>
            <th colSpan={2} className="px-4 py-2">
              DRep
            </th>
            <th className="px-4 py-2 ">Status</th>
            <th className="px-4 py-2">Live Power</th>
            <th className="px-4 py-2">Active Power</th>
            <th className="px-4 py-2">Amount of Holders</th>
            <th colSpan={3} className="px-4 py-2">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {isDRepsLoading ? (
            <tr >
              <td colSpan={10} className="text-center">Loading.....</td>
            </tr>
          ) : (
            filteredDreps.map((drep) => (
              <tr key={drep.drep_hash_id} className="text-left text-sm text-nowrap">
                <td className="px-4 py-2">{drep.view}</td>
                <td className="px-4 py-2">{drep.epoch_no}</td>
                <td className="px-4 py-2">Coming soon</td>
                <td className="px-4 py-2">
                  <StatusChip status={statusChecker(drep.deposit)} />
                </td>
                <td className="px-4 py-2">
                  <StatusChip status={isActive(drep.epoch_no, drep.active_until)?"Active":"Inactive"} />
                </td>
                <td className="px-4 py-2">₳ {drep.amount}</td>
                <td className="px-4 py-2">₳ {drep.amount}</td>
                <td className="px-4 py-2">Representative for {drep.delegation_vote_count}</td>
                <td className="px-4 py-2">
              <div className="flex space-x-2">
                <HoverChip icon="/link.svg" text="View Profile" handleClick={()=>console.log('going to drep', drep.view)} />
                <HoverChip icon="/user-circle.svg" text="Link DRep" handleClick={()=>console.log('linked to drep', drep.view)}/>
                <HoverChip icon="/medal.svg" text="Claim DRep Profile" handleClick={()=>console.log('claiming drep', drep.view)}/>
              </div>
            
            </td>
              </tr>
            ))
          )}
          {/* <tr className="text-left text-nowrap text-sm">
            <td className="px-4 py-2">877937979437979</td>
            <td className="px-4 py-2">2 Epoch</td>
            <td className="px-4 py-2">C. Miner</td>
            <td className="px-4 py-2">
              <StatusChip status="Not registered" />
            </td>
            <td className="px-4 py-2">
              <StatusChip status="Active" />
            </td>
            <td className="px-4 py-2">₳ 123,020,987</td>
            <td className="px-4 py-2">₳ 123,020,987</td>
            <td className="px-4 py-2">Representative for 23</td>
            
            <td className="px-4 py-2">
              <div className="flex space-x-2">
                <HoverChip icon="/link.svg" text="View Profile" />
                <HoverChip icon="/user-circle.svg" text="Link DRep" />
                <HoverChip icon="/medal.svg" text="Claim DRep Profile" />
              </div>
            
            </td>
          </tr> */}
        </tbody>
      </table>
    </div>
  );
};

export default DRepsTable;

//   sample=<tr className='text-left text-nowrap'>
//   <td className="px-4 py-2">877937979437979</td>
//   <td className="px-4 py-2">2 Epoch</td>
//   <td className="px-4 py-2">C. Miner</td>
//   <td className="px-4 py-2"><StatusChip status='Not registered'/></td>
//   <td className="px-4 py-2"><StatusChip status='Active'/></td>
//   <td className="px-4 py-2">₳ 123,020,987</td>
//   <td className="px-4 py-2">₳ 123,020,987</td>
//   <td className="px-4 py-2">Representative for 23</td>
//   <td className="pl-2 py-2">
//     <img src="/link.svg" alt="Link icon" />
//   </td>
//   <td className="pr-2 py-2">
//     <img src="/user-circle.svg" alt="User icon" />
//   </td>
// </tr>
