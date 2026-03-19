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
    try {
      if (!activity || !Array.isArray(activity)) return [];

      // 1. Separate epoch boundaries and sort them DESC by epoch number
      const epochBoundaries = [...activity.filter(item => item && item.type === 'epoch')]
        .sort((a, b) => (b.no || 0) - (a.no || 0));
      const otherActivities = activity.filter(item => item && item.type !== 'epoch');
      
      const EPOCH_DURATION = 432000000; // 5 days in ms

      // 2. Pre-calculate epoch windows for robust timestamp matching
      const epochWindows = epochBoundaries.map(e => {
        const start = e.start_time ? new Date(e.start_time).getTime() : 0;
        const end = e.end_time ? new Date(e.end_time).getTime() : (start ? start + EPOCH_DURATION : 0);
        return { no: e.no, header: e, start, end };
      });

      // 2b. Prepare reference for mathematical calculation if headers are missing
      const refHeader = epochWindows[0];

      // 3. Group non-epoch items by their epoch number
      const groups = new Map<number, any[]>();

      const getEffectiveEpochNo = (item: any) => {
        if (!item) return null;
        
        // Priority 1: Direct epoch_no on item or proposal
        const explicit = item.epoch_no || item.proposal?.epoch_no;
        if (explicit) return explicit;

        // Priority 2: Timestamp-based matching against existing windows
        const tsString = item.timestamp || item.voted_at || item.submitted_at || (item.items && item.items[0]?.timestamp);
        if (tsString) {
          const ts = new Date(tsString).getTime();
          if (!isNaN(ts)) {
            const matched = epochWindows.find(w => ts >= w.start && ts <= w.end);
            if (matched) return matched.no;

            // Priority 3: Mathematical calculation relative to first header
            if (refHeader) {
               return refHeader.no + Math.floor((ts - refHeader.start) / EPOCH_DURATION);
            }
          }
        }
        
        return null;
      };

      const pushToGroup = (item: any) => {
        if (!item) return;
        const epochNo = getEffectiveEpochNo(item);
        
        // If we still can't find an epoch, use a dummy or skip grouping
        const finalEpochNo = epochNo !== null ? epochNo : -1;

        if (!groups.has(finalEpochNo)) groups.set(finalEpochNo, []);
        groups.get(finalEpochNo)?.push(item);
      };

      const allDelegations: any[] = [];
      otherActivities.forEach((item) => {
        if (item.type === 'delegation') {
          allDelegations.push(item);
        } else {
          pushToGroup(item);
        }
      });

      // 4. Build final interleaved list: Newest Epoch Header -> Newest Epoch Events -> ...
      const result: any[] = [];
      const usedEpochs = new Set<number>();

      epochBoundaries.forEach(header => {
        result.push(header);
        usedEpochs.add(header.no);
        
        const items = groups.get(header.no);
        if (items) {
          result.push(...items);
        }
      });

      // 5. Catch-all for items whose epoch headers might be missing from the 'activity' array
      const remainingEpochNos = Array.from(groups.keys()).sort((a, b) => b - a);
      remainingEpochNos.forEach(no => {
        if (!usedEpochs.has(no) && no !== -1) {
          const items = groups.get(no);
          if (items) result.push(...items);
        }
      });

      // 6. Handle items that failed all epoch detection (-1 group)
      const unmapped = groups.get(-1);
      if (unmapped) result.push(...unmapped);

      // 7. Append all delegations as a single bundle at the end
      if (allDelegations.length > 0) {
        result.push({
          type: 'bundled_delegations',
          items: allDelegations,
          id: `bundle-all-delegations`,
          timestamp: allDelegations[0].timestamp,
          epoch_no: allDelegations[0].epoch_no
        });
      }

      return result;
    } catch (err) {
      console.error('Error processing timeline activity:', err);
      return activity;
    }
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
