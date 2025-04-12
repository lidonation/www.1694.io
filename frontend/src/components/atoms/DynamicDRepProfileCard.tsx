import React, { useEffect, useState } from 'react';
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
import { useDRepContext } from '@/context/drepContext';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { deleteItemFromIndexedDB } from '@/lib/indexedDb';
import { renderJSONLDToJSONArr } from '@/lib/metadataProcessor';
import Button from './Button';
import StatusChip from './StatusChip';
import MetadataViewer from './MetadataViewer';
import DRepSocialLinks from './DRepSocialLinks';
import MetadataEditor from './MetadataEditor';
import SubmitMetadataModal from './SubmitMetadataModal';
import DRepAvatarCard from './DRepAvatarCard';
import DRepIdHolder from './DRepIdHolder';
import ClaimProfileButton from './ClaimProfileButton';
import { useGetDRepMetadataQuery } from '@/hooks/useGetDRepMetadataQuery';
import { useGetOwnership } from '@/hooks/useGetOwnership';
import { useGetAdaHolderCurrentDelegationQuery } from '@/hooks/useGetAdaHolderCurrentDelegationQuery';
import { useDelegateTodRep } from '@/hooks/useDelegateToDRep';
import { SingleDRep } from '../../../types/api';

interface DynamicDRepProfileCardProps {
  drep: SingleDRep;
  voterId: string;
  loading: boolean;
}

const DynamicDRepProfileCard: React.FC<DynamicDRepProfileCardProps> = ({
  drep,
  voterId,
  loading,
}) => {
  const { isMobile } = useScreenDimension();
  const { stakeKey, dRepIDBech32 } = useCardano();
  const { setLoginModalOpen, isLoggedIn, setDrepToBeClaimed } =
    useDRepContext();
  const { addSuccessAlert } = useGlobalNotifications();
  const { delegate, isDelegating } = useDelegateTodRep();
  const [canEdit, setCanEdit] = useState(false);
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
  const isClaimed =
    drep?.type === 'scripted' ||
    drep?.type === 'voting_option' ||
    drep?.drep_id;
  const isOwner = ownership?.result;

  const metadataJson =
    !isMetadataLoading && metadata ? renderJSONLDToJSONArr(metadata) : null;
  const name = metadata?.body?.givenName || metadata?.body?.dRepName;
  const displayName = name
    ? renderJsonLdValue(name)
    : convertString(drep?.view, isMobile);
  const handleDelegate = () => {
    delegate(drep?.view, { isRetired: drep?.retired });
  };



  useEffect(() => {
    if (drep?.view) {
      setDrepToBeClaimed(drep?.view);
    }
  }, [drep?.view]);

  const resetDraft = async () => {
    removeItemFromLocalStorage('isUpdating');
    await deleteItemFromIndexedDB('metadataJsonLd');
    await deleteItemFromIndexedDB('metadataJsonHash');
  };

  const renderStatusChips = () => (
    <div className="flex flex-row gap-2">
      {drep?.type === 'scripted' && <StatusChip status="Scripted" />}
      {drep?.type === 'voting_option' && <StatusChip status="Voting Option" />}
      {!isClaimed && <StatusChip status="Not claimed" />}
      {drep?.retired && drep?.type !== 'voting_option' && (
        <StatusChip status="Retired" />
      )}
      <StatusChip
        status={
          drep?.type === 'voting_option' ? 'Active' : checkStatus(drep?.active)
        }
      />
      {isDelegated && (
        <Tooltip title="You have delegated to this DRep">
          <span>
            <button>
              <StatusChip status="Your DRep" />
            </button>
          </span>
        </Tooltip>
      )}
    </div>
  );

  const renderUnsavedChanges = () => {
    if (!getItemFromLocalStorage('isUpdating') || isSubmittingMetadata)
      return null;

    return (
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
              Your changes are still locally saved. It's recommended to submit
              to avoid losing your changes.
            </p>
            <Button
              handleClick={() => setIsSubmittingMetadata(true)}
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
  };

  return (
    <div className="flex flex-col gap-5 bg-white bg-opacity-50 px-5 py-10">
      <DRepAvatarCard
        loading={loading}
        imageSrc={metadata?.body?.image?.contentUrl}
      />

      {/* Profile Name */}
      <div className="w-full">
        <Typography
          variant="h4"
          sx={{
            whiteSpace: 'normal',
            wordBreak: 'break-word',
          }}
        >
          {loading ? (
            <Skeleton animation="wave" variant="text" width={200} height={50} />
          ) : (
            displayName
          )}
        </Typography>
      </div>

      {renderStatusChips()}

      {!isClaimed && (
        <ClaimProfileButton
          label="Claim this profile"
          drepToBeClaimed={drep?.view}
        />
      )}
      {!isDelegated && (
        <Button
          className="w-full"
          disabled={!!isDelegating}
          handleClick={handleDelegate}
        >
          Delegate
        </Button>
      )}

      <div className="flex items-center gap-4">
        <div>
          <Typography variant="h6">Voting power</Typography>
          <p className="flex items-center gap-3 font-normal">
            {loading ? (
              <Skeleton animation="wave" width={50} height={20} />
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
            {loading ? (
              <Skeleton animation="wave" width={50} height={20} />
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
          {loading ? (
            <Skeleton animation="wave" width={100} height={20} />
          ) : (
            `${drep?.delegation_vote_count || 0} ${
              Number(drep?.delegation_vote_count) > 1
                ? 'Delegators'
                : 'Delegator'
            }`
          )}
        </p>
      </div>

      <fieldset className="rounded-2xl border border-blue-100 px-2">
        <legend className="font-bold">DRep ID</legend>
        <div className="flex flex-col items-start justify-center gap-1 divide-y divide-blue-100 pb-2">
          <DRepIdHolder
            loading={loading}
            drepId={convertHexToCIP129(!!drep?.has_script, drep?.chain_id)}
            isCIP129={true}
          />
          <DRepIdHolder
            loading={loading}
            drepId={drep?.view}
            isCIP129={false}
            className="pt-1"
          />
        </div>
      </fieldset>

      <DRepSocialLinks links={metadata?.body?.references} />

      <div>
        {isMetadataLoading ? (
          <Skeleton animation="wave" width={150} height={20} />
        ) : (
          <MetadataViewer
            metadata={metadata}
            isMetadataLoading={isMetadataLoading}
            metadataError={metadataError}
            metadataUrl={drep?.metadata_url}
          />
        )}
      </div>

      {isClaimed && isOwner && (
        <div>
          {canEdit && (
            <MetadataEditor
              onClose={() => setCanEdit(false)}
              initialMetadata={metadataJson}
              onSuccessfulSubmit={() => setIsSubmittingMetadata(true)}
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
              metadataType="drepUpdate"
            />
          )}
          {renderUnsavedChanges()}
        </div>
      )}

      {isClaimed && isOwner && (
        <div className="flex max-w-prose flex-col gap-2">
          <Button
            handleClick={
              isLoggedIn
                ? () => setCanEdit(true)
                : () => setLoginModalOpen(true)
            }
            className="w-full"
          >
            {isLoggedIn ? 'Edit Metadata' : 'Login to update'}
          </Button>
          {isLoggedIn && isOwner && (
            <Link href="/dreps/workflow/profile/update/step1">
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

export default DynamicDRepProfileCard;
