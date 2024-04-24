import React from 'react';
interface StatusProps {
    status: "Verified" | "Unverified" | "Not registered" | "Active" | "Inactive";
  }
const StatusChip = ({ status }: StatusProps) => {
  let statusClass = '';
  switch (status) {
    case "Verified":
      statusClass = 'bg-[#0033AD] text-pure-white';
      break;
    case 'Unverified':
      statusClass = 'bg-[#2E3438] text-pure-white';
      break;
    case 'Not registered':
      statusClass = 'bg-[#FF640A] text-pure-white';
      break;
    case 'Active':
      statusClass = 'bg-[#C2EFF2] text-[#242232]';
      break;
    case 'Inactive':
      statusClass = 'bg-[#2E3438] text-pure-white';
      break;
    default:
      statusClass = 'bg-[#2E3438] text-pure-white'; // Default to gray if status is not recognized
  }

  return (
    <div className={`text-center text-nowrap rounded-full px-2 py-1 font-semibold text-sm  ${statusClass}`}>
      {status}
    </div>
  );
};

export default StatusChip;
