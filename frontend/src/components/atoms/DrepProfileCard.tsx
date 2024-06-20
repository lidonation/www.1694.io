import React from 'react';
import Button from './Button';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Typography } from '@mui/material';
import Link from 'next/link';

interface StatusProps {
  status:
    | 'Verified'
    | 'Unverified'
    | 'Claimed'
    | 'Active'
    | 'Inactive'
    | 'Not claimed';
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
    case 'Not claimed':
      statusClass = 'bg-orange-500 text-white';
      break;
    case 'Claimed':
      statusClass = 'bg-teal-100 text-zinc-800';
      break;
    case 'Active':
      statusClass = 'bg-teal-100 text-zinc-800';
      break;
    case 'Inactive':
      statusClass = 'bg-gray-800 text-white';
      break;
    default:
      statusClass = 'bg-gray-800 text-white'; // Default to gray if status is not recognized
  }

  return (
    <div
      className={`text-nowrap rounded-full px-2 py-1 text-center text-sm font-normal ${statusClass}`}
    >
      {status}
    </div>
  );
};

const DrepProfileCard = () => {
  return (
    <div className='flex flex-col gap-5 max-w-64'>
      <div className="flex  items-center justify-center rounded-md">
        <img className="w-full" src="/sample.png" alt="" />
      </div>
      <div>
        <Typography variant="h4">
          Charles Miner
        </Typography>
      </div>
      <div className="flex flex-row gap-2">
        <StatusChip status="Active" />
        <StatusChip status="Verified" />
      </div>
      <div>
        <p className="font-bold">Voting power</p>
        <p>₳ 47.92</p>
      </div>
      <div>
        <p className="font-bold">Total delegation</p>
        <p>25 Delegators</p>
      </div>
      <div className="flex flex-row gap-2 rounded-full border border-blue-100 px-4 py-2">
      <p className='overflow-x-scroll text-nowrap'>ID 098290SACX876X323d768QAS92</p>
        <CopyToClipboard
          text={'textToCopy'}
          onCopy={() => {
            console.log('copied!');
          }}
          className="clipboard-text cursor-pointer"
        >
          <img src="/copy.svg" alt="copy" />
        </CopyToClipboard>
      </div>
      <div className="flex flex-row gap-2">
        {/* Social links */}
        
        <Link href="#">
            <img className='w-full' src="/github-dark.svg" alt="" />
        </Link>
        <Link href="#">
            <img className='w-full' src="/twitter.svg" alt="" />
        </Link>
        <Link href="#">
            <img className='w-full' src="/fb-dark.svg" alt="" />
        </Link>
        <Link href="#">
            <img className='w-full' src="/ig-dark.svg" alt="" />
        </Link>
      </div>
      <div>
        <p className="font-bold">Bio</p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
          vulputate, enim sit amet accumsan elementum, lorem ipsum dolor sit
          amet, consectetur adipiscing elit. Sed vulputate, enim sit amet
          accumsan elementum, lorem ipsum dolor sit amet, consectetur
          adipiscing.
        </p>
      </div>
      <div>
        <p className="font-bold">Statement</p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
          vulputate, enim sit amet accumsan elementum, lorem ipsum dolor sit
          amet, consectetur adipiscing elit. Sed vulputate, enim sit amet
          accumsan elementum, lorem ipsum dolor sit amet, consectetur
          adipiscing.
        </p>
      </div>
      <div>
        <p className='font-bold'>Metadata</p>
        <p>None</p>
      </div>
      <div className="flex flex-col gap-2">
        <Button>Set up Metadata</Button>
        <Button variant="outlined" bgColor="transparent">
          Edit Profile
        </Button>
      </div>
    </div>
  );
};

export default DrepProfileCard;