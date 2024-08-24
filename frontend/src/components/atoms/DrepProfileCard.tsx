import React, { useEffect, useState } from 'react';
import Button from './Button';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Typography, Skeleton } from '@mui/material';
import Link from 'next/link';
import { convertString, formattedAda } from '@/lib';
import { useScreenDimension } from '@/hooks';
import { useCardano } from '@/context/walletContext';
import MetadataViewer from './MetadataViewer';
import { isActive } from '../molecules/DRepsTable';
import { processExternalMetadata } from '@/lib/metadataProcessor';
import DRepSocialLinks from './DRepSocialLinks';

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

const DrepProfileCard = ({ drep, state }: { drep: any; state: boolean }) => {
  const { isMobile } = useScreenDimension();
  const { dRepIDBech32 } = useCardano();
  const [status, setStatus] = useState<any>('Inactive');
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<any>(null);
  useEffect(() => {
    const fetchData = async () => {
      const metadataUrl = drep?.cexplorerDetails?.metadata_url;
      setMetadataUrl(metadataUrl);
      if (!metadataUrl) return;
      try {
        setIsMetadataLoading(true);
        setMetadataError(null);
        const { jsonLdData, modifiedJson } = await processExternalMetadata({
          metadataUrl,
        });
        setMetadata(jsonLdData);
        const imageUrl = jsonLdData?.body?.image?.contentUrl;
        if (imageUrl) {
          setImageSrc(imageUrl);
        }
        if (
          jsonLdData?.body?.references &&
          Array.isArray(jsonLdData?.body?.references) &&
          jsonLdData?.body?.references.length > 0
        ) {
          setSocialLinks(jsonLdData?.body?.references);
        }
        const name = modifiedJson.filter(
          (item: any) => item.key === 'givenName',
        )[0]?.value;
        setName(name);
      } catch (error) {
        console.log(error);
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
  }, []);
  return (
    <div className="flex w-full flex-col gap-5 bg-white bg-opacity-50 px-5 py-10">
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
            src={`${imageSrc ? imageSrc : '/svgs/user-circle.svg'}`}
            alt=""
          />
        )}
      </div>
      <div className="w-full">
        <Typography
          variant="h4"
          sx={{
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {state ? (
            <Skeleton
              animation={'wave'}
              variant="text"
              width={200}
              height={50}
            />
          ) : (
            drep &&
            (name
              ? name
              : drep?.cexplorerDetails?.view &&
                convertString(drep?.cexplorerDetails?.view, isMobile))
          )}
        </Typography>
      </div>
      <div className="flex flex-row gap-2">
        <StatusChip status={status} />
        <StatusChip status="Verified" />
      </div>
      <div>
        <Typography variant="h6">Voting power</Typography>
        <p className="flex items-center gap-3 font-normal">
          ₳{' '}
          {state ? (
            <Skeleton animation={'wave'} width={50} height={20} />
          ) : (
            formattedAda(drep?.cexplorerDetails?.amount, 2) || 0
          )}
        </p>
      </div>
      <div>
        <Typography variant="h6">Total delegation</Typography>
        <p>
          {' '}
          {state ? (
            <Skeleton animation={'wave'} width={100} height={20} />
          ) : (
            `${drep?.cexplorerDetails?.delegation_vote_count || 0} ${drep?.cexplorerDetails?.delegation_vote_count > 1 ? 'Delegators' : 'Delegator'}`
          )}
        </p>
      </div>
      <div className="flex w-fit flex-row gap-2 rounded-full border border-blue-100 px-4 py-2">
        <p className="flex w-full items-center gap-3 ">
          ID{' '}
          {state ? (
            <Skeleton animation={'wave'} width={150} height={20} />
          ) : (
            drep?.cexplorerDetails?.view &&
            convertString(drep?.cexplorerDetails?.view, true)
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
      <DRepSocialLinks links={socialLinks} />
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
      {(drep?.cexplorerDetails?.view == dRepIDBech32 ||
        drep?.signature_drepVoterId == dRepIDBech32) && (
        <div className="flex max-w-prose flex-col gap-2">
          <Link href={`/dreps/workflow/profile/update/step5`}>
            <Button className="w-full">
              {metadata ? 'Edit' : 'Set up'} Metadata
            </Button>
          </Link>
          <Link href={`/dreps/workflow/profile/update/step1`}>
            <Button className="w-full" variant="outlined" bgColor="transparent">
              Edit Profile
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default DrepProfileCard;
