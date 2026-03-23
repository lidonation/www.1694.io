import React, { useEffect, useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { keyframes } from '@emotion/react';

const highlightAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0px var(--highlight-glow), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: transparent;
  }
  20% {
    box-shadow: 0 0 0 4px var(--highlight-glow), 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    border-color: var(--highlight-border);
  }
  100% {
    box-shadow: 0 0 0 0px var(--highlight-glow), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: transparent;
  }
`;

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
  minimal?: boolean;
}

const VoteStatusChip = ({ date, vote, minimal }: { date: string; vote: string; minimal?: boolean }) => {
  const [bgcolor, setBgColor] = useState('complementary-100');
  const [icon, setIcon] = useState('/svgs/file-check.svg');

  useEffect(() => {
    if (vote === 'No') {
      setBgColor('bg-red-100');
      setIcon('/svgs/close.svg');
    } else if (vote === 'Yes') {
      setBgColor('bg-green-100');
      setIcon('/svgs/check.svg');
    } else if (vote === 'Abstain') {
      setBgColor('bg-complementary-100');
      setIcon('/svgs/alert-circle.svg');
    }
  }, [vote]);

  return (
    <div className="flex flex-row items-center justify-between">
      <div
        className={`flex w-fit flex-row items-center gap-1 rounded-full ${bgcolor} ${minimal ? 'p-0.5 px-1.5' : 'px-2 py-1'} text-sm`}
      >
        <img src={icon} className={`${minimal ? 'h-3.5 w-3.5' : 'h-5 w-5'}`} alt="Vote icon" />
        {minimal && <span className={`text-[10px] font-bold ${vote === 'Yes' ? 'text-green-700' : vote === 'No' ? 'text-red-700' : 'text-gray-600'}`}>{vote}</span>}
      </div>
      <div className="flex flex-col items-end">
        {!minimal && <p className="text-[9px] uppercase font-bold text-gray-400 leading-none">Voted at</p>}
        <p className={`${minimal ? 'text-[10px]' : 'text-[11px]'} font-medium text-gray-500`}>
          {new Date(date).toLocaleString(undefined, minimal ? {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          } : {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
};

const DrepVoteTimelineCard = ({
  item,
  isVoteOwner = false,
  minimal = false,
}: DrepVoteTimelineCardProps) => {
  const [isHighlighted, setIsHighlighted] = useState(false);
  const elementId = `vote-${(item as any)?.id || (item as any)?.vote_tx_hash || (item as any)?.gov_action_proposal_id}`;

  const highlightStyles = {
    Yes: {
      glow: 'rgba(52, 211, 153, 0.4)',
      border: '#10b981',
    },
    No: {
      glow: 'rgba(239, 68, 68, 0.4)',
      border: '#ef4444',
    },
    Abstain: {
      glow: 'rgba(156, 163, 175, 0.4)',
      border: '#9ca3af',
    },
  };

  const currentHighlight = highlightStyles[item.vote as keyof typeof highlightStyles] || highlightStyles.Abstain;

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === `#${elementId}`) {
        setIsHighlighted(true);
        setTimeout(() => setIsHighlighted(false), 2000);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Check on mount

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [elementId]);

  const [rationaleModalOptions, setRationalModalOptions] =
    useState<VoteRationaleModalProps>({
      mode: 'view',
      open: false,
      onClose: () => { },
      onEdit: () => { },
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
            {minimal ? 'Rationale' : 'View Rationale'}
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
            {minimal ? '+ Rationale' : 'Add Rationale'}
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
  
  //@ts-ignore
  const submittedAt = item?.proposal.submitted_at;

  return (
    <Box
      id={elementId}
      className={`flex w-full flex-col ${minimal ? 'gap-2 p-2.5' : 'gap-3 p-3'} rounded-xl bg-white shadow-lg`}
      sx={{
        border: '2px solid transparent',
        transition: 'all 0.3s ease',
        '--highlight-glow': currentHighlight.glow,
        '--highlight-border': currentHighlight.border,
        ...(isHighlighted && {
          animation: `${highlightAnimation} 2s ease-out forwards`,
        })
      }}
    >
      <VoteStatusChip date={item?.time_voted} vote={item?.vote} minimal={minimal} />
      <VoteRationaleModal {...rationaleModalOptions} />
      <hr className="border-gray-100" />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          flex: '1',
          gap: minimal ? '0.5rem' : '1rem',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Box>
            <p className={`overflow-hidden text-ellipsis ${minimal ? 'text-xs' : 'text-sm'} font-bold`}>
              {title || '-'}
            </p>
            {!minimal && (item as DrepVote).proposal?.rationale && (
              <p className="mt-2 line-clamp-3 text-xs text-gray-500">
                {(item as DrepVote).proposal?.rationale}
              </p>
            )}
          </Box>

          {actionDetais.actionName !== '' && (
            <Box>
              <Box
                className={`flex w-fit items-center gap-2 rounded-full bg-slate-200 ${minimal ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-sm'}`}
              >
                <img
                  src={actionDetais.imgSrc}
                  alt={`${actionDetais.actionName} icon`}
                  className={minimal ? 'h-3 w-3' : 'h-5 w-5'}
                />
                <p className="whitespace-normal break-words text-left">{minimal && actionDetais.actionName.length > 30 ? actionDetais.actionName.substring(0, 30) + '...' : actionDetais.actionName}</p>
              </Box>
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="flex flex-wrap items-center gap-2 items-end justify-between">
            <Box className={`flex w-fit items-center gap-1 rounded-full border ${minimal ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-xs'} text-gray-500`}>
              <p className="">Action Hash:</p>
              <CopyToClipboard text={item?.txHash || (item as any)?.tx_hash} truncate>
                <img src="/svgs/copy.svg" alt="copy" className="h-3 w-3 opacity-50" />
              </CopyToClipboard>
            </Box>

            {!minimal && submittedAt && (
              <div className="flex flex-col items-end px-1">
                <p className="text-[9px] uppercase font-bold text-gray-400">Submitted at</p>
                <p className="text-[10px] font-medium text-gray-500">
                  {new Date(submittedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          <div className={`flex items-center gap-2 ${minimal ? 'mt-1' : 'mt-2'}`}>
            {renderRationaleButton()}
            <ViewExternalGovAction 
              actionId={item?.gov_action_proposal_id} 
              txHash={item?.txHash || (item as any)?.tx_hash}
              txIndex={Number((item as any)?.gov_action_proposal_index) || 0}
              minimal={minimal} 
            />
          </div>
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
