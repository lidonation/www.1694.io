import React, { useEffect, useState } from 'react';
import Button from './Button';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import StatusChip from './StatusChip';
import Link from 'next/link';
import { Skeleton, Typography } from '@mui/material';
import { convertString, formattedAda } from '@/lib';
import MetadataViewer from './MetadataViewer';
import { isActive } from '../molecules/DRepsTable';
import { getExternalMetadata } from '@/services/requests/postExternalMetadataUrl';

const DrepClaimProfileCard = ({
  drep,
  state,
}: {
  drep: any;
  state: boolean;
}) => {
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<any>('Inactive');
  useEffect(() => {
    const fetchData = async () => {
      const metadataUrl = drep?.cexplorerDetails?.metadata_url;
      setMetadataUrl(metadataUrl);
      if (!metadataUrl) return;
      try {
        setIsMetadataLoading(true);
        setMetadataError(null);
        const response = await getExternalMetadata({ metadataUrl });
        const jsonLdData = response;
        setMetadata(jsonLdData);
      } catch (error) {
        setMetadata(null);
        setMetadataError('Metadata Unprocessable');
      } finally {
        setIsMetadataLoading(false);
      }
    };
    const checkStatus = () => {
      let status;
      if (drep?.type !== 'voting_option') {
        status = isActive(
          drep?.cexplorerDetails?.epoch_no,
          drep?.cexplorerDetails?.active_until,
        )
          ? 'Active'
          : 'Inactive';
        setStatus(status);
      }
    };
    checkStatus();
    fetchData();
  }, [drep]);
  return (
    <div className="flex flex-col gap-5 bg-white bg-opacity-50 px-5 py-10 ">
      <div className="flex max-w-52 items-center justify-center rounded-md">
        {state ? (
          <Skeleton
            animation={'wave'}
            variant="circular"
            width={150}
            height={150}
          />
        ) : (
          <img
            className="w-full"
            src={`${drep?.attachment_url ? drep.attachment_url : '/svgs/user-circle.svg'}`}
            alt=""
          />
        )}
      </div>
      {drep?.type !== 'voting_option' && (
        <Link className="w-full" href={`/dreps/workflow/profile/new`}>
          <Button className="w-full">Claim this profile</Button>
        </Link>
      )}
      {/* todo: fix to accurate status */}
      <div className="flex flex-row gap-2">
        <StatusChip
          status={drep?.type === 'voting_option' ? 'Claimed' : 'Not claimed'}
        />
        <StatusChip
          status={drep?.type === 'voting_option' ? 'Active' : status}
        />
      </div>
      <div>
        <p className="font-bold">Voting power</p>
        <p className="flex items-center gap-3 font-normal">
          ₳{' '}
          {state ? (
            <Skeleton animation={'wave'} width={100} height={20} />
          ) : (
            formattedAda(drep?.cexplorerDetails?.amount, 2) || 0
          )}
        </p>
      </div>
      <div>
        <p className="font-bold">Total delegation</p>
        <p>
          {state ? (
            <Skeleton animation={'wave'} width={150} height={20} />
          ) : (
            `${drep?.cexplorerDetails?.delegation_vote_count || 0} ${drep?.cexplorerDetails?.delegation_vote_count > 1 ? 'Delegators' : 'Delegator'}`
          )}
        </p>
      </div>
      <div className="flex w-fit flex-row gap-2 rounded-full border border-blue-100 px-5 py-2">
        <p className="flex w-full items-center gap-3">
          ID{' '}
          {state ? (
            <Skeleton animation={'wave'} width={150} height={20} />
          ) : (
            convertString(drep?.cexplorerDetails?.view || '', true)
          )}
        </p>
        <CopyToClipboard
          text={drep?.cexplorerDetails?.view}
          onCopy={() => {
            console.log('copied!');
          }}
          className="clipboard-text cursor-pointer"
        >
          <img src="/svgs/copy.svg" alt="copy" />
        </CopyToClipboard>
      </div>
      <div className="flex flex-row gap-2">
        <Link href={drep ? drep?.drep_social?.github || '#' : '#'}>
          <img className="w-full" src="/svgs/github-dark.svg" alt="" />
        </Link>
        <Link href={drep ? drep?.drep_social?.x || '#' : '#'}>
          <img className="w-full" src="/svgs/twitter.svg" alt="" />
        </Link>
        <Link href={drep ? drep?.drep_social?.facebook || '#' : '#'}>
          <img className="w-full" src="/svgs/fb-dark.svg" alt="" />
        </Link>
        <Link href={drep ? drep?.drep_social?.instagram || '#' : '#'}>
          <img className="w-full" src="/svgs/ig-dark.svg" alt="" />
        </Link>
      </div>
      <div>
        {state ? (
          <Skeleton animation={'wave'} width={150} height={20} />
        ) : (
          <MetadataViewer
            metadata={metadata}
            isMetadataLoading={isMetadataLoading}
            metadataError={metadataError}
            metadataUrl={metadataUrl}
          />
        )}
      </div>
      <div>
        <Typography variant="h6">Statement</Typography>
        <p className="text-sm">
          {' '}
          {state ? (
            <Skeleton animation={'wave'} width={150} height={20} />
          ) : (
            drep?.drep_platform_statement || 'Empty'
          )}
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
