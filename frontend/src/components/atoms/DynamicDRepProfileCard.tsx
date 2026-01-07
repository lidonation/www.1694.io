import React, { useState } from 'react';
import {
  Typography,
  Skeleton,
  AccordionSummary,
  Accordion,
  AccordionDetails,
  Tooltip,
  Box,
} from '@mui/material';
import Link from 'next/link';
import {
  checkStatus,
  compareDRepIDs,
  convertHexToCIP129,
  convertString,
  formatAsCurrency,
  formattedAda,
  getItemFromLocalStorage,
  removeItemFromLocalStorage,
  renderJsonLdValue,
  setItemToLocalStorage,
  shortNumber,
} from '@/lib';
import { useScreenDimension } from '@/hooks';
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
import { useGetAdaHolderCurrentDelegationQuery } from '@/hooks/useGetAdaHolderCurrentDelegationQuery';
import { useDelegateTodRep } from '@/hooks/useDelegateToDRep';
import { SingleDRep } from '../../../types/api';
import { ModalType, useModals, useWallet } from '@/context/globalContext';
import ProfileSkeletonLoader from '../Loaders/ProfileSkeletonLoader';
import LinearProgressBar from '../molecules/LinearProgressBar';
import { useGetDRepParticipationQuery } from '@/hooks/useGetDRepParticipationQuery';
import { AnimatedOdometer } from './DRepMetricCard';

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
  const {
    wallet: { stakeKey, isConnected },
    user: { dRepProfilesClaimed },
    setUserInfo,
  } = useWallet();
  const { openModal } = useModals();
  const { addSuccessAlert } = useGlobalNotifications();
  const { delegate, isDelegating } = useDelegateTodRep();
  const [canEdit, setCanEdit] = useState(false);
  const [isSubmittingMetadata, setIsSubmittingMetadata] = useState(false);
  const [hoveredOnWarning, setHoveredOnWarning] = useState(false);
  const { metadata, isMetadataLoading, metadataError } =
    useGetDRepMetadataQuery(!drep?.metadata ? voterId : '');
  const { currentDelegation } = useGetAdaHolderCurrentDelegationQuery(stakeKey);
  const { participationData, isParticipationDataLoading } =
    useGetDRepParticipationQuery(voterId);

    console.log({participationData});
  const isDelegated = compareDRepIDs(drep?.view, currentDelegation?.drep_view);
  const isClaimed =
    drep?.type === 'scripted' ||
    drep?.type === 'voting_option' ||
    drep?.drep_id;
  const isOwner = dRepProfilesClaimed?.some(
    (claimedDRep) => claimedDRep?.claimedDRepBech32 === drep?.view,
  );

  const activeMetadata = metadata || drep?.metadata?.json_metadata;

  const metadataJson =
    !isMetadataLoading && activeMetadata ? renderJSONLDToJSONArr(activeMetadata) : null;
  const name = activeMetadata?.body?.givenName || activeMetadata?.body?.dRepName;
  const displayName = name
    ? renderJsonLdValue(name)
    : drep?.type === 'voting_option'
      ? drep?.view
      : convertString(drep?.view, isMobile);

  const handleDelegate = () => {
    delegate(drep?.view, { isRetired: drep?.retired });
  };

  const handleEditProfile = () => {
    if (drep?.type !== 'scripted' && drep?.type !== 'voting_option') {
      setUserInfo({
        dRepClaimInfo: {
          dRepIDToClaimBech32: drep?.view,
        },
      });
      setItemToLocalStorage('isUpdating', true);
    }
  };

  const resetDraft = async () => {
    removeItemFromLocalStorage('isUpdating');
    await deleteItemFromIndexedDB('metadataJsonLd');
    await deleteItemFromIndexedDB('metadataJsonHash');
  };

  const renderStatusChips = () => (
    <div className="flex flex-row items-center gap-2">
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
    <Box className="flex w-full flex-col bg-white/50 lg:flex-row">
      <Box className="flex flex-col gap-5 p-5 lg:sticky lg:top-10 lg:w-[30%] lg:self-start">
        <DRepAvatarCard
          loading={loading}
          imageSrc={activeMetadata?.body?.image?.contentUrl}
          size="large"
          showStatusInfo
          variant="rounded"
        />

        <Box className="w-full">
          <Typography
            variant="h4"
            sx={{
              whiteSpace: 'normal',
              wordBreak: 'break-word',
            }}
          >
            {loading ? (
              <Skeleton
                animation="wave"
                variant="text"
                width={200}
                height={50}
              />
            ) : (
              displayName
            )}
          </Typography>
        </Box>

        {renderStatusChips()}

        <Box className="flex flex-wrap gap-2">
          {!isClaimed && drep?.view && (
            <ClaimProfileButton
              size="small"
              className="w-fit"
              label="Claim profile"
              drepToBeClaimed={drep?.view}
            />
          )}
          {!isDelegated && (
            <Button
              size="small"
              className="w-fit"
              disabled={!!isDelegating}
              handleClick={handleDelegate}
            >
              Delegate
            </Button>
          )}
        </Box>

        <Box className="flex items-center gap-4">
          <Box>
            <Typography variant="h6">Voting power</Typography>
            <p className="flex items-center gap-3 font-normal">
              {loading ? (
                <Skeleton animation="wave" width={50} height={20} />
              ) : drep?.voting_power != null ? (
                `₳ ${shortNumber(parseInt(drep?.voting_power), 2)}`
              ) : (
                '-'
              )}
            </p>
          </Box>
          <Box>
            <Typography variant="h6">Live Stake</Typography>
            <p className="flex items-center gap-3 font-normal">
              {loading ? (
                <Skeleton animation="wave" width={50} height={20} />
              ) : drep?.live_stake != null ? (
                `₳ ${shortNumber(parseInt(drep?.live_stake), 2)}`
              ) : (
                '-'
              )}
            </p>
          </Box>
        </Box>

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

        <Box>
          <Typography variant="h6">Total delegation</Typography>
          <p>
            {loading ? (
              <Skeleton animation="wave" width={100} height={20} />
            ) : (
              `${formatAsCurrency(drep?.delegation_vote_count || 0)} ${
                Number(drep?.delegation_vote_count) > 1
                  ? 'Delegators'
                  : 'Delegator'
              }`
            )}
          </p>
        </Box>

        <DRepSocialLinks links={activeMetadata?.body?.references} />
      </Box>

      <Box className="bg-white p-5 lg:w-[70%]">
        <Box className="mb-8">
          <Typography variant="h6" className="">
            Metrics
          </Typography>
          <Box className="flex flex-col gap-4">
            <Box>
              <Box className="flex items-start">
                <AnimatedOdometer
                  value={participationData?.total_actions || 0}
                  className="text-xl font-black"
                  isLoading={isParticipationDataLoading}
                  width={undefined}
                  height={undefined}
                />
              </Box>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', fontWeight: 500 }}>
                Total Governance Actions
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 14 }}>
              Governance Actions Participation
            </Typography>
            {drep?.type !== 'voting_option' && (
              <LinearProgressBar
                primaryValue={participationData?.participation}
                secondaryValue={participationData?.non_participation}
                primaryPercentage={Number(
                  (
                    (participationData?.participation /
                      participationData?.total_actions) *
                    100
                  ).toFixed(2),
                )}
                secondaryPercentage={Number(
                  (
                    (participationData?.non_participation /
                      participationData?.total_actions) *
                    100
                  ).toFixed(2),
                )}
                primaryLabel="Voted"
                secondaryLabel="Not Voted"
                primaryColor="#4caf50"
                secondaryColor="#f44336"
                isLoading={isParticipationDataLoading}
                dataAvailability={!!participationData}
              />
            )}
            {drep?.type === 'voting_option' && (
              <Typography sx={{ fontSize: 12 }}>
                This is a voting option DRep and does not participate in
                governance directly.
              </Typography>
            )}
          </Box>
        </Box>
        <Box className="flex flex-col gap-5">
          <div>
            {isMetadataLoading ? (
              <ProfileSkeletonLoader />
            ) : (
              <MetadataViewer
                metadata={activeMetadata}
                isMetadataLoading={isMetadataLoading && !activeMetadata}
                metadataError={metadataError}
                metadataUrl={drep?.metadata_url || drep?.metadata?.url}
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
            <div className="flex max-w-prose flex-wrap gap-2">
              <Button
                handleClick={
                  isConnected
                    ? () => setCanEdit(true)
                    : () => {
                        openModal(ModalType.LOGIN);
                      }
                }
                className="w-fit"
              >
                {isConnected ? 'Edit Metadata' : 'Login to update'}
              </Button>
              {isConnected && isOwner && (
                <Link
                  href="/dreps/workflow/profile/update/step1"
                  onClick={handleEditProfile}
                  className="w-fit"
                >
                  <Button
                    className="w-fit"
                    variant="outlined"
                    bgcolor="transparent"
                  >
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DynamicDRepProfileCard;
