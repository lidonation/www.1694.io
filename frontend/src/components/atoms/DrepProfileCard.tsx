import React, { useState } from 'react';
import Button from './Button';
import {
  Typography,
  Skeleton,
  AccordionSummary,
  Accordion,
  AccordionDetails,
  Tooltip,
} from '@mui/material';
import Link from 'next/link';
import {
  checkStatus,
  compareDRepIDs,
  convertHexToCIP129,
  convertString,
  formattedAda,
  getItemFromLocalStorage,
  removeItemFromLocalStorage,
  renderJsonLdValue,
} from '@/lib';
import { useScreenDimension } from '@/hooks';
import { useCardano } from '@/context/walletContext';
import MetadataViewer from './MetadataViewer';
import { renderJSONLDToJSONArr } from '@/lib/metadataProcessor';
import DRepSocialLinks from './DRepSocialLinks';
import MetadataEditor from './MetadataEditor';
import SubmitMetadataModal from './SubmitMetadataModal';
import { deleteItemFromIndexedDB } from '@/lib/indexedDb';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import DRepAvatarCard from './DRepAvatarCard';
import { useDRepContext } from '@/context/drepContext';
import { useGetDRepMetadataQuery } from '@/hooks/useGetDRepMetadataQuery';
import DRepIdHolder from './DRepIdHolder';
import { useGetOwnership } from '@/hooks/useGetOwnership';
import { useGetAdaHolderCurrentDelegationQuery } from '@/hooks/useGetAdaHolderCurrentDelegationQuery';
import { useDelegateTodRep } from '@/hooks/useDelegateToDRep';
import StatusChip from './StatusChip';

interface StatusProps {
  status:
    | 'Verified'
    | 'Unverified'
    | 'Claimed'
    | 'Active'
    | 'Inactive'
    | 'Not claimed';
}

type DrepProfileCardProps = {
  drep: any;
  voterId: string;
  state: boolean;
};

const DrepProfileCard = ({ drep, voterId, state }: DrepProfileCardProps) => {
  const { isMobile } = useScreenDimension();
  const { stakeKey, dRepIDBech32 } = useCardano();
  const { setLoginModalOpen, isLoggedIn, setDrepToBeClaimed } =
    useDRepContext();
  const [canEdit, setCanEdit] = useState(false);
  const { addSuccessAlert } = useGlobalNotifications();
  const [isSubmittingMetadata, setIsSubmittingMetadata] = useState(false);
  const [hoveredOnWarning, setHoveredOnWarning] = useState(false);
  const { ownership } = useGetOwnership({
    drepId: drep?.view,
    voterId: dRepIDBech32,
  });
  const { metadata, isMetadataLoading, metadataError } =
    useGetDRepMetadataQuery(voterId);
  const { currentDelegation } = useGetAdaHolderCurrentDelegationQuery(stakeKey);
  const isDelegated = compareDRepIDs(drep?.view, currentDelegation?.drep_view);

  const { delegate, isDelegating } = useDelegateTodRep();

  const ctaActions = [
    {
      label: metadata ? 'Edit Metadata' : 'Set up Metadata',
      action: () => setCanEdit(true),
    },
    {
      label: 'Login to update',
      action: () => setLoginModalOpen(true),
    },
  ];

  let metadataJson: {};
  let name: string;

  if (!isMetadataLoading && metadata) {
    metadataJson = renderJSONLDToJSONArr(metadata);
    name = renderJsonLdValue(
      metadata?.body?.givenName || metadata?.body?.dRepName,
    );
  }

  const handleEdit = () => {
    setDrepToBeClaimed(drep?.view);
  };
  const renderUnsavedChanges = () => {
    const slider = (
      <Accordion>
        <AccordionSummary
          expandIcon={
            <img
              src="/svgs/chevron-down.svg"
              alt="expand"
              className="h-5 w-5"
            />
          }
        >
          <div className="flex items-center gap-2">
            <img
              onClick={() => setHoveredOnWarning(!hoveredOnWarning)}
              src="/svgs/toastsvgs/alert-triangle.svg"
              alt="Warning"
              className="h-8 w-8 animate-pulse cursor-pointer"
            />
            <Typography variant="body1">Unsaved Changes</Typography>
          </div>
        </AccordionSummary>
        <AccordionDetails>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-red-500">
              Your changes are still locally saved. Its recommended to submit to
              avoid losing your changes.
            </p>
            <Button
              handleClick={() => {
                setIsSubmittingMetadata(true);
              }}
              className="w-full"
            >
              Submit Changes
            </Button>
            <Button
              variant="outlined"
              bgcolor="transparent"
              handleClick={() => {
                resetDraft();
                window.location.reload();
              }}
              className="w-full"
            >
              Discard Changes
            </Button>
          </div>
        </AccordionDetails>
      </Accordion>
    );

    if (getItemFromLocalStorage('isUpdating') && !isSubmittingMetadata) {
      return slider;
    }
    return null;
  };

  const resetDraft = async () => {
    removeItemFromLocalStorage('isUpdating');
    await deleteItemFromIndexedDB('metadataJsonLd');
    await deleteItemFromIndexedDB('metadataJsonHash');
  };

  return (
    <div className="flex w-full flex-col gap-5 bg-white bg-opacity-50 px-5 py-10">
      <DRepAvatarCard
        state={state}
        imageSrc={metadata?.body?.image?.contentUrl}
      />
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
            (name ? name : drep?.view && convertString(drep?.view, isMobile))
          )}
        </Typography>
      </div>
      <div className="flex flex-row gap-2">
        <StatusChip status={checkStatus(drep?.active)} />
        <StatusChip status="Verified" />
        {isDelegated && (
          <Tooltip title="You have delegated to this DRep">
            <button>
              <StatusChip status="Your DRep" />
            </button>
          </Tooltip>
        )}
      </div>
      <div>
        {!isDelegated && (
          <Button
            className="w-full"
            disabled={!!isDelegating}
            handleClick={() => {
              delegate(drep?.view, { isRetired: drep?.retired });
            }}
          >
            Delegate
          </Button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div>
          <Typography variant="h6">Voting power</Typography>
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
          <Typography variant="h6">Live Stake</Typography>
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
        <Typography variant="h6">Total delegation</Typography>
        <p>
          {' '}
          {state ? (
            <Skeleton animation={'wave'} width={100} height={20} />
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
      <div>
        {canEdit && (
          <MetadataEditor
            onClose={() => {
              setCanEdit(false);
            }}
            initialMetadata={metadataJson}
            onSuccessfulSubmit={() => {
              setIsSubmittingMetadata(true);
            }}
          />
        )}
        {isSubmittingMetadata && (
          <SubmitMetadataModal
            onClose={() => setIsSubmittingMetadata(false)}
            onSuccessfulSubmit={() => {
              addSuccessAlert(
                'Metadata updated successfully. It will probably take few minutes to reflect',
              );
              resetDraft();
            }}
          />
        )}
        {ownership?.result &&
          ownership?.result === true &&
          renderUnsavedChanges()}
      </div>
      {ownership?.result && ownership?.result === true && (
        <div className="flex max-w-prose flex-col gap-2">
          <Button
            handleClick={
              isLoggedIn ? ctaActions[0].action : ctaActions[1].action
            }
            className="w-full"
          >
            {isLoggedIn ? ctaActions[0].label : ctaActions[1].label}
          </Button>
          {isLoggedIn && (
            <Link
              href={`/dreps/workflow/profile/update/step1`}
              onClick={handleEdit}
            >
              <Button
                className="w-full"
                variant="outlined"
                bgcolor="transparent"
              >
                Edit Profile
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default DrepProfileCard;
