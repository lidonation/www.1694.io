import React from 'react';
import Button from './Button';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import StatusChip from './StatusChip';
import Link from 'next/link';
import { Skeleton } from '@mui/material';
import { convertString, formattedAda } from '@/lib';
import MetadataViewer from './MetadataViewer';
import { isActive } from '../molecules/DRepsTable';
import DRepSocialLinks from './DRepSocialLinks';
import DRepAvatarCard from './DRepAvatarCard';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { useGetDRepMetadataQuery } from '@/hooks/useGetDRepMetadataQuery';

const DrepClaimProfileCard = ({
  drep,
  state,
}: {
  drep: any;
  state: boolean;
}) => {
  const { dRepIDBech32 } = useCardano();
  const { isLoggedIn } = useDRepContext();
  const { metadata, isMetadataLoading, metadataError } =
    useGetDRepMetadataQuery(drep?.view);

  const checkStatus = () => {
    if (drep?.type !== 'voting_option') {
      return isActive(drep?.epoch_no, drep?.active_until)
        ? 'Active'
        : 'Inactive';
    }
  };

  return (
    <div className="flex flex-col gap-5 bg-white bg-opacity-50 px-5 py-10 ">
      <DRepAvatarCard
        state={state}
        imageSrc={metadata?.body?.image?.contentUrl}
      />
      {drep?.type !== 'scripted' && drep?.type !== 'voting_option' && (
        <Link className="w-full" href={`/dreps/workflow/profile/new`}>
          <Button className="w-full">Claim this profile</Button>
        </Link>
      )}
      <div className="flex flex-row gap-2">
        {drep?.type === 'scripted' && <StatusChip status="Scripted" />}
        {drep?.type === 'voting_option' && (
          <StatusChip status="Voting Option" />
        )}
        {drep?.type !== 'scripted' && drep?.type !== 'voting_option' && (
          <StatusChip status="Not claimed" />
        )}
        {drep?.retired && drep?.type !== 'voting_option' && (
          <StatusChip status="Retired" />
        )}
        <StatusChip
          status={drep?.type === 'voting_option' ? 'Active' : checkStatus()}
        />
      </div>
      <div className="flex items-center gap-4">
        <div>
          <p className="font-bold">Voting power</p>
          <p className="flex items-center gap-3 font-normal">
            {state ? (
              <Skeleton animation={'wave'} width={50} height={20} />
            ) : drep?.voting_power != null ? (
              `₳ ${formattedAda(drep?.voting_power, 2)}`
            ) : (
              '-'
            )}
          </p>
        </div>
        <div>
          <p className="font-bold">Live Stake</p>
          <p className="flex items-center gap-3 font-normal">
            {state ? (
              <Skeleton animation={'wave'} width={50} height={20} />
            ) : drep?.live_stake != null ? (
              `₳ ${formattedAda(drep?.live_stake, 2)}`
            ) : (
              '-'
            )}
          </p>
        </div>
      </div>
      <div>
        <p className="font-bold">Total delegation</p>
        <p>
          {state ? (
            <Skeleton animation={'wave'} width={150} height={20} />
          ) : (
            `${drep?.delegation_vote_count || 0} ${drep?.delegation_vote_count > 1 ? 'Delegators' : 'Delegator'}`
          )}
        </p>
      </div>
      <div className="flex w-fit flex-row gap-2 rounded-full border border-blue-100 px-5 py-2">
        <p className="flex w-full items-center gap-3">
          ID{' '}
          {state ? (
            <Skeleton animation={'wave'} width={150} height={20} />
          ) : (
            convertString(drep?.view || '', true)
          )}
        </p>
        <CopyToClipboard
          text={drep?.view}
          onCopy={() => {
            console.log('copied!');
          }}
          className="clipboard-text cursor-pointer"
        >
          <img src="/svgs/copy.svg" alt="copy" />
        </CopyToClipboard>
      </div>
      <DRepSocialLinks links={metadata?.body?.references} />
      <div>
        {state ? (
          <Skeleton animation={'wave'} width={150} height={20} />
        ) : (
          <MetadataViewer
            metadata={metadata}
            isMetadataLoading={isMetadataLoading}
            metadataError={metadataError}
            metadataUrl={drep?.metadata_url}
          />
        )}
      </div>
      {(drep?.view == dRepIDBech32 ||
        drep?.signature_voterId == dRepIDBech32) &&
        isLoggedIn && (
          <div className="flex max-w-prose flex-col gap-2">
            <Link href={`/dreps/workflow/profile/new`}>
              <Button className="w-full">Claim your profile to update</Button>
            </Link>
          </div>
        )}
    </div>
  );
};

export default DrepClaimProfileCard;
