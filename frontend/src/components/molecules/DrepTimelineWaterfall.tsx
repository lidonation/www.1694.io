'use client';
import React from 'react';
import { useScreenDimension } from '@/hooks';
import { useWallet } from '@/context/globalContext';
import { convertDrepPhraseToCIP105Legacy } from '@/lib';
import { Tooltip } from '@mui/material';
import DrepTimelineMobile from './DrepTimelineMobile';
import DrepTimelineDesktop from './DrepTimelineDesktop';

const DrepTimelineWaterfall = ({
  activity = [],
  drepId,
  isAtLatestPoint,
  isAtOldestPoint,
  onLoadNewer,
  onLoadOlder,
}: {
  activity: any[];
  drepId: string;
  isAtLatestPoint?: boolean;
  isAtOldestPoint?: boolean;
  onLoadNewer?: () => void;
  onLoadOlder?: () => void;
}) => {
  const { isMobile, screenWidth } = useScreenDimension();
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const {
    wallet: { stakeKeyBech32, isConnected },
    user: { dRepProfilesClaimed },
  } = useWallet();
  const isOwner = dRepProfilesClaimed?.some(
    (drep) =>
      drep.claimedDRepBech32 === convertDrepPhraseToCIP105Legacy(drepId),
  );

  const [stickyTargetId, setStickyTargetId] = React.useState<{ newer: string | null; older: string | null }>({
    newer: null,
    older: null
  });

  React.useEffect(() => {
    const handleScroll = () => {
      const votes = document.querySelectorAll('[id^="vote-"]');
      let currentVoteId: string | null = null;
      let minDistance = Infinity;

      votes.forEach((v) => {
        const rect = v.getBoundingClientRect();
        const distance = Math.abs(rect.top - window.innerHeight / 2);
        if (distance < minDistance) {
          minDistance = distance;
          currentVoteId = v.id.replace('vote-', '');
        }
      });

      if (currentVoteId) {
        const index = activity.findIndex(i => i.id === currentVoteId || i.vote_tx_hash === currentVoteId || i.gov_action_proposal_id === currentVoteId);
        const newer = activity.slice(0, index).reverse().find(i => i.type === 'voting_activity');
        const older = activity.slice(index + 1).find(i => i.type === 'voting_activity');
        
        setStickyTargetId({
          newer: (newer as any)?.id || (newer as any)?.vote_tx_hash || (newer as any)?.gov_action_proposal_id || null,
          older: (older as any)?.id || (older as any)?.vote_tx_hash || (older as any)?.gov_action_proposal_id || null
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activity]);

  const processedActivity = React.useMemo(() => {
    const result: any[] = [];
    let currentBundle: any[] = [];

    activity.forEach((item, index) => {
      if (item.type === 'delegation') {
        currentBundle.push(item);
      } else {
        if (currentBundle.length > 0) {
          if (currentBundle.length > 1) {
            result.push({
              type: 'bundled_delegations',
              items: [...currentBundle],
              id: `bundle-${currentBundle[0].id}`,
              timestamp: currentBundle[0].timestamp
            });
          } else {
            result.push(currentBundle[0]);
          }
          currentBundle = [];
        }
        result.push(item);
      }

      if (index === activity.length - 1 && currentBundle.length > 0) {
        if (currentBundle.length > 1) {
          result.push({
            type: 'bundled_delegations',
            items: [...currentBundle],
            id: `bundle-${currentBundle[0].id}`,
            timestamp: currentBundle[0].timestamp
          });
        } else {
          result.push(currentBundle[0]);
        }
      }
    });

    return result;
  }, [activity]);

  const stickyPos = React.useMemo(() => {
    if (screenWidth >= 1400) return { right: 'calc(50% - 700px)', left: 'auto' };
    if (screenWidth >= 1024) return { right: '16px', left: 'auto' };
    return { right: 'auto', left: '8px' };
  }, [screenWidth]);

  const commonProps = {
    processedActivity,
    isAtLatestPoint,
    isAtOldestPoint,
    onLoadNewer,
    onLoadOlder,
    stakeKeyBech32,
    isConnected,
    isOwner,
  };

  return (
    <div className="relative w-full" ref={timelineRef}>
      <div 
        className="fixed z-50 flex flex-col gap-2"
        style={{ 
          top: '50%', 
          right: stickyPos.right, 
          left: stickyPos.left,
          transform: 'translateY(-50%)' 
        }}
      >
        <Tooltip title={stickyTargetId.newer ? "Jump to Newer Vote" : isAtLatestPoint ? "No more newer votes" : "Load Newer History"} placement="left">
          <button 
            onClick={() => {
              if (stickyTargetId.newer) {
                const targetId = `vote-${stickyTargetId.newer}`;
                // Update URL without jumping
                window.history.pushState(null, '', `#${targetId}`);
                // Manually trigger hashchange for highlight animation
                window.dispatchEvent(new HashChangeEvent('hashchange'));
                // Smooth scroll
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else if (onLoadNewer && !isAtLatestPoint) {
                onLoadNewer();
              } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className={`p-1.5 sm:p-2 rounded-full bg-white border border-gray-200 text-gray-500 transition-all shadow-lg hover:bg-gray-50 hover:scale-110 ${!stickyTargetId.newer && isAtLatestPoint ? 'opacity-30' : 'opacity-100'}`}
          >
            <img src="/svgs/chevron-up.svg" className="w-4 h-4 sm:w-5 sm:h-5" alt="Up" />
          </button>
        </Tooltip>

        <Tooltip title={stickyTargetId.older ? "Jump to Older Vote" : isAtOldestPoint ? "No more older votes" : "Load Older History"} placement="left">
          <button 
            onClick={() => {
              if (stickyTargetId.older) {
                const targetId = `vote-${stickyTargetId.older}`;
                // Update URL without jumping
                window.history.pushState(null, '', `#${targetId}`);
                // Manually trigger hashchange for highlight animation
                window.dispatchEvent(new HashChangeEvent('hashchange'));
                // Smooth scroll
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else if (onLoadOlder && !isAtOldestPoint) {
                onLoadOlder();
              } else {
                timelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
              }
            }}
            className={`p-1.5 sm:p-2 rounded-full bg-white border border-gray-200 text-gray-500 transition-all shadow-lg hover:bg-gray-50 hover:scale-110 ${!stickyTargetId.older && isAtOldestPoint ? 'opacity-30' : 'opacity-100'}`}
          >
            <img src="/svgs/chevron-down.svg" className="w-4 h-4 sm:w-5 sm:h-5" alt="Down" />
          </button>
        </Tooltip>
      </div>

      {isMobile ? (
        <DrepTimelineMobile {...commonProps} />
      ) : (
        <DrepTimelineDesktop {...commonProps} /> 
      )}
    </div>
  );
};

export default React.memo(DrepTimelineWaterfall);
