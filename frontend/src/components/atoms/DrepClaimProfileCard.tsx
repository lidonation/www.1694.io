import React from 'react';
import Button from './Button';
import StatusChip from './StatusChip';
import Link from 'next/link';
import { Skeleton } from '@mui/material';
import { checkStatus, convertHexToCIP129, formattedAda } from '@/lib';
import MetadataViewer from './MetadataViewer';
import DRepSocialLinks from './DRepSocialLinks';
import DRepAvatarCard from './DRepAvatarCard';
import { useCardano } from '@/context/walletContext';
import { useDRepContext } from '@/context/drepContext';
import { useGetDRepMetadataQuery } from '@/hooks/useGetDRepMetadataQuery';
import DRepIdHolder from './DRepIdHolder';

type DrepClaimProfileCardProps = {
  drep: any;
  voterId: string;
  state: boolean;
};

const DrepClaimProfileCard = ({
  drep,
  voterId,
  state,
}: DrepClaimProfileCardProps) => {
  const { dRepIDBech32 } = useCardano();
  const { isLoggedIn } = useDRepContext();
  const { metadata, isMetadataLoading, metadataError } =
    useGetDRepMetadataQuery(voterId);

  return (
    <div className="flex flex-col gap-5 bg-white bg-opacity-50 px-5 py-10">
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
          status={
            drep?.type === 'voting_option'
              ? 'Active'
              : checkStatus(drep?.active)
          }
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
      <fieldset className="rounded-2xl border border-blue-100 px-2">
        <legend className="font-bold">DRep ID</legend>
        <div className="flex flex-col items-start justify-center gap-1 divide-y divide-blue-100 pb-2">
          <DRepIdHolder
            state={state}
            drepId={convertHexToCIP129(drep?.has_script, drep?.chain_id)}
            isCIP129={true}
          />
          <DRepIdHolder
            state={state}
            drepId={drep?.view}
            isCIP129={false}
            className="pt-1"
          />
        </div>
      </fieldset>
      <DRepSocialLinks links={metadata?.body?.references} />
      <div>
        {isMetadataLoading ? (
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
