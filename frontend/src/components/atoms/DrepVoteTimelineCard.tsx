import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import CopyToClipboard from './CopyToClipboard';
import { DrepVote } from '../../../types/timeline';
import Button from './Button';
import {
  VoteRationaleModal,
  VoteRationaleModalProps,
} from '../molecules/VoteRationaleModal';
import { GovAction } from '../../../types/api';
import { useWallet } from '@/context/globalContext';
import { ViewExternalGovAction } from '@/components/atoms/ViewExternalGovAction';

interface DrepVoteTimelineCardProps {
  item: DrepVote | GovAction;
  isVoteOwner?: boolean;
}

const VoteStatusChip = ({ date, vote }: { date: string; vote: string }) => {
  const [bgcolor, setBgColor] = useState('complementary-100');

  useEffect(() => {
    if (vote === 'No') setBgColor('bg-red-100');
    else if (vote === 'Yes') setBgColor('bg-green-100');
    else if (vote === 'Abstain') setBgColor('bg-complementary-100');
  }, []);
  return (
    <div className="flex flex-row items-center justify-between">
      <div
        className={`flex w-fit flex-row items-center gap-1 rounded-full ${bgcolor} px-2 py-1 text-sm`}
      >
        <img src="/svgs/file-check.svg" className="h-5 w-5" alt="Vote icon" />
        <p>{vote}</p>
      </div>
      <p className="text-sm">{new Date(date).toLocaleDateString('en-GB')}</p>
    </div>
  );
};

const DrepVoteTimelineCard = ({
  item,
  isVoteOwner,
}: DrepVoteTimelineCardProps) => {
  const [rationaleModalOptions, setRationalModalOptions] =
    useState<VoteRationaleModalProps>({
      mode: 'view',
      open: false,
      onClose: () => {},
      onEdit: () => {},
      rationaleUrl: item?.vote_rationale,
    });
  const { latestEpoch } = useWallet();
  const title = (item as DrepVote).proposal?.title || (item as DrepVote).proposal?.abstract || (item as any)?.metadata?.body?.title;
  const isEnacted = item?.enacted_epoch && latestEpoch > item?.enacted_epoch;
  const isExpired =
    item?.expiration_epoch && latestEpoch > item?.expiration_epoch;
  const tag = (item as DrepVote).proposal?.type || (item?.type as string);

  let actionDetais: { imgSrc: string; actionName: string } = {
    imgSrc: '/svgs/exchange.svg',
    actionName: '',
  };

  switch (true) {
    case tag?.toLowerCase().includes('parameterchange'):
      actionDetais = {
        imgSrc: '/svgs/exchange.svg',
        actionName: 'Protocol Parameter Changes',
      };
      break;
    case tag?.toLowerCase().includes('noconfidence'):
      actionDetais = {
        imgSrc: '/svgs/info-circle.svg',
        actionName: 'No Confidence',
      };
      break;
    case tag?.toLowerCase().includes('infoaction'):
      actionDetais = {
        imgSrc: '/svgs/info-circle.svg',
        actionName: 'Info',
      };
      break;
    case tag?.toLowerCase().includes('hardforkinitiation'):
      actionDetais = {
        imgSrc: '/svgs/status-change.svg',
        actionName: 'Hard-Fork Initiation',
      };
      break;
    case tag?.toLowerCase().includes('newconstitution'):
      actionDetais = {
        imgSrc: '/svgs/notebook.svg',
        actionName: 'New Constitution or Guardrails Script',
      };
      break;
    case tag?.toLowerCase().includes('newcommittee'):
    case tag?.toLowerCase().includes('updatecommittee'):
      actionDetais = {
        imgSrc: '/svgs/users-group.svg',
        actionName: 'Update committee and/or threshold and/or terms',
      };
      break;
  }

  const handleRationaleModalOpen = (options: VoteRationaleModalProps) => {
    setRationalModalOptions({
      ...options,
      open: true,
    });
  };

  const handleRationaleModalClose = () => {
    setRationalModalOptions({
      ...rationaleModalOptions,
      open: false,
    });
  };

  const renderRationaleButton = () => {
    switch (true) {
      // Case 1: If there's an existing rationale, show View button
      case !!item?.vote_rationale:
        return (
          <Button
            handleClick={() =>
              handleRationaleModalOpen({
                mode: 'view',
                open: true,
                onClose: handleRationaleModalClose,
                rationaleUrl: item?.vote_rationale,
              })
            }
            color="primary"
            size="small"
          >
            View Rationale
          </Button>
        );

      // Case 2: Vote owner and can add rationale (not expired and not enacted)
      case !item?.vote_rationale && isVoteOwner && !isEnacted && !isExpired:
        return (
          <Button
            handleClick={() =>
              handleRationaleModalOpen({
                mode: 'edit',
                open: true,
                onClose: handleRationaleModalClose,
                rationaleUrl: item?.vote_rationale,
                extraData: {
                  vote: item?.vote,
                  voteTxHash: item?.gov_action_proposal_id,
                  voteTxIndex: Number(item?.gov_action_proposal_index) || 0,
                  voterId: item?.view,
                  isOwner: isVoteOwner,
                },
              })
            }
            color="primary"
            size="small"
          >
            Add Rationale
          </Button>
        );

      case !item?.vote_rationale && isVoteOwner && isExpired: // Case 3: Vote owner but proposal is enacted
      case !item?.vote_rationale && isVoteOwner && isEnacted: // Case 4: Vote owner but proposal is enacted
      case !item?.vote_rationale: // Case 5: No rationale provided
        return null;

      default:
        return null;
    }
  };

  return (
    <Box
      id="epoch-card"
      className="flex w-full flex-col gap-3 rounded-xl bg-white p-3 shadow-lg"
    >
      <VoteStatusChip date={item?.time_voted} vote={item?.vote} />
      <VoteRationaleModal {...rationaleModalOptions} />
      <hr />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          flex: '1',
          gap: '1rem',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Box>
            <p className="overflow-hidden text-ellipsis text-sm font-bold">
              {title || '-'}
            </p>
            {(item as DrepVote).proposal?.rationale && (
              <p className="mt-2 line-clamp-3 text-xs text-gray-500">
                {(item as DrepVote).proposal?.rationale}
              </p>
            )}
          </Box>

          {actionDetais.actionName !== '' && (
            <Box>
              <Box
                className={`flex w-fit items-center gap-2 rounded-full bg-slate-200 p-1 px-3 py-1 text-sm`}
              >
                <img
                  src={actionDetais.imgSrc}
                  alt={`${actionDetais.actionName} icon`}
                  className="h-5 w-5"
                />
                <p className="whitespace-normal break-words text-left">{actionDetais.actionName}</p>
              </Box>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Box className="flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm">
            <p className="">Action ID:</p>
            <CopyToClipboard text={item?.gov_action_proposal_id} truncate>
              <img src="/svgs/copy.svg" alt="copy" />
            </CopyToClipboard>
          </Box>

          {renderRationaleButton()}
          <ViewExternalGovAction actionId={item?.gov_action_proposal_id} />
        </Box>
      </Box>
    </Box>
  );
};

export default DrepVoteTimelineCard;

const UniformCardWrapper = ({ children }) => {
  return (
    <div
      className="uniform-card-wrapper"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style jsx>{`
        .uniform-card-wrapper :global(#epoch-card) {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 250px;
        }
      `}</style>
      {children}
    </div>
  );
};

export { UniformCardWrapper };
