'use client';
import { Box } from '@mui/material';
import React from 'react';
interface StatusProps {
  status:
    | 'Verified'
    | 'Unverified'
    | 'Claimed'
    | 'Active'
    | 'Inactive'
    | 'Not claimed'
    | 'Not registered'
    | 'Scripted'
    | 'Voting Option'
    | 'Delegated'
    | 'Your DRep'
    | 'Not Delegated'
    | 'Retired';
}
const StatusChip = ({ status }: StatusProps) => {
  let statusClass = '';
  switch (status) {
    case 'Verified':
      statusClass = 'bg-blue-800 text-white';
      break;
    case 'Unverified':
      statusClass = 'bg-gray-800 text-white';
      break;
    case 'Not registered':
      statusClass = 'bg-orange-500 text-white';
      break;
    case 'Retired':
      statusClass = 'bg-orange-500 text-white';
      break;
    case 'Active':
      statusClass = 'bg-success text-zinc-800';
      break;
    case 'Your DRep':
      statusClass = 'bg-success text-zinc-800';
      break;
    case 'Delegated':
      statusClass = 'bg-success text-zinc-800';
      break;
    case 'Inactive':
      statusClass = 'bg-gray-800 text-white';
      break;
    case 'Not Delegated':
      statusClass = 'bg-gray-800 text-white';
      break;
    case 'Scripted':
      statusClass = 'bg-blue-800 text-white';
      break;
    case 'Voting Option':
      statusClass = 'bg-blue-800 text-white';
      break;
    case 'Claimed':
      statusClass = 'bg-blue-800 text-white';
      break;
    case 'Not claimed':
      statusClass = 'bg-gray-800 text-white';
      break;
    case 'Not registered':
      statusClass = 'bg-orange-500 text-white';
      break;
    case 'Not Delegated':
      statusClass = 'bg-gray-800 text-white';
      break;
    case 'Retired':
      statusClass = 'bg-orange-500 text-white';
      break;
    default:
      statusClass = 'bg-gray-800 text-white';
  }

  return (
    <Box
      component="span"
      className={`rounded-full px-2 py-1 text-center text-xs font-normal text-nowrap ${statusClass}`}
    >
      {status}
    </Box>
  );
};

export default StatusChip;
