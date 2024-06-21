import React from 'react';
import Button from './Button';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import StatusChip from './StatusChip';


const DrepClaimProfileCard = () => {
  return (
    <div className='bg-white bg-opacity-50 px-5 py-10 flex flex-col gap-5 '>
      <div className="flex items-center justify-center rounded-md">
        <img className="w-full" src="/sample.png" alt="" />
      </div>
      <Button>Claim this profile</Button>
      <div className="flex flex-row gap-2">
        <StatusChip status="Not claimed" />
        <StatusChip status="Unverified" />
      </div>
      <div>
        <p className="font-bold">Voting power</p>
        <p>₳ 47.92</p>
      </div>
      <div>
        <p className="font-bold">Total delegation</p>
        <p>25 Delegators</p>
      </div>
      <div className="flex flex-row gap-2 rounded-full border border-blue-100 px-5 py-2">
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
        <img src="/github-dark.svg" alt="" />
        <img src="/twitter.svg" alt="" />
        <img src="/fb-dark.svg" alt="" />
        <img src="/ig-dark.svg" alt="" />
      </div>
      <div>
        <p className="font-bold">Bio</p>
        <p>
         Empty
        </p>
      </div>
      <div>
        <p className="font-bold">Statement</p>
        <p>
         Empty
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button disabled>Set up Metadata</Button>
        <Button disabled variant="outlined" bgColor="transparent">
          Update Metadata
        </Button>
      </div>
    </div>
  );
};

export default DrepClaimProfileCard;