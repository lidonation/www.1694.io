'use client';
import DRepProfileBar from '@/components/atoms/DrepProfileBar';
import DrepProfileCard from '@/components/atoms/DrepProfileCard';
import DrepTabGroup from '@/components/atoms/DrepTabGroup';
import { useEffect, useState } from 'react';
import { Grid, IconButton } from '@mui/material';
import DrepTimeline from '@/components/molecules/DrepTimeline';
import DrepProfileMetrics from '@/components/molecules/DrepProfileMetrics';
import { useParams } from 'next/navigation';
import { getSingleDRep } from '@/services/requests/getSingleDrep';
import { getSingleDRepViaVoterId } from '@/services/requests/getSingleDrepViaVoterId';
import DrepClaimProfileCard from '@/components/atoms/DrepClaimProfileCard';
import { useScreenDimension } from '@/hooks';
import { useCardano } from '@/context/walletContext';

const page = () => {
  const [currentTab, setCurrentTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const { latestEpoch, dRepIDBech32 } = useCardano();
  const { isMobile, screenWidth } = useScreenDimension();
  const [drep, setDrep] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const { drepid } = useParams();
  useEffect(() => {
    if (drepid) {
      const getDrepData = async (drepid: any) => {
        setIsLoading(true);
        let res;
        if (drepid.includes('drep')) {
          res = await getSingleDRepViaVoterId(drepid);
        } else {
          res = await getSingleDRep(drepid);
        }
        setDrep(res);
        setIsLoading(false);
      };
      getDrepData(drepid);
    }
  }, []);
  return (
    <div className="flex">
      {/* If current user is a drep, the drawer will be available for use */}
      {drep?.drep_id && drep?.cexplorerDetails?.view == dRepIDBech32 && (
        <DRepProfileBar isOpen={isOpen} setIsOpen={setIsOpen} />
      )}
      <div className="base_container w-full">
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-start">
            <div className="w-[30%]">
              {drep?.drep_id && drep?.cexplorerDetails?.view == dRepIDBech32 && (
                <IconButton
                  data-testid="close-drawer-button"
                  onClick={() => {
                    setIsOpen(!isOpen);
                  }}
                >
                  <img width={'50%'} className="shrink-0" src={'/svgs/menu.svg'} />
                </IconButton>
              )}
            </div>
            <div className="w-[70%]">
              <DrepTabGroup setActiveTab={setCurrentTab} />
            </div> 
          </div>
          {currentTab === 'profile' ? (
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-[30%]">
                {drep?.drep_id ? (
                  <DrepProfileCard drep={drep} state={isLoading} />
                ) : (
                  <DrepClaimProfileCard drep={drep} state={isLoading} />
                )}
              </div>
              <div className="lg:w-[70%]">
                <DrepTimeline
                  drepId={drep?.drep_id}
                  latestEpoch={latestEpoch}
                  cexplorerDetails={drep?.cexplorerDetails}
                  activity={drep?.activity}
                />
              </div>
            </div>
          ) : (
            <DrepProfileMetrics drepMetrics={drep} />
          )}
        </div>
      </div>
    </div>
  );
};

export default page;
