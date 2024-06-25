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
import { getSingleDRepViaVoterIdDetails } from '@/services/requests/getSingleDrepViaVoterIdDetails';

const page = () => {
  const [currentTab, setCurrentTab] = useState('profile');
  const [isOpen, setIsOpen] = useState(false);
  const { drepid } = useParams();
  useEffect(() => {
    if (drepid) {
      const getDrepData = async (drepid: any) => {
        let res;
        if (drepid.includes('drep')) {
          res = await getSingleDRepViaVoterIdDetails(drepid);
        } else {
          res = await getSingleDRep(drepid);
        }
      };
      getDrepData(drepid);
    }
  }, []);
  return (
    <div className="flex">
      <DRepProfileBar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="base_container w-full">
        <Grid container style={{ height: '100%' }}>
          {currentTab === 'profile' && (
            <Grid item xs={3} className="flex items-center">
              <IconButton
                data-testid="close-drawer-button"
                onClick={() => {
                  setIsOpen(!isOpen);
                }}
                sx={{ padding: 0, width: '15%' }}
              >
                <img src={'/menu.svg'} />
              </IconButton>
            </Grid>
          )}
          <Grid item xs={9}>
            <DrepTabGroup setActiveTab={setCurrentTab} />
          </Grid>
          {currentTab === 'profile' ? (
            <>
              <Grid item xs={3}>
                <DrepProfileCard />
                {/* <DrepClaimProfileCard/> */}
              </Grid>
              <Grid item xs={9}>
                <DrepTimeline />
              </Grid>
            </>
          ) : (
            <Grid item xs={12} className="bg-white bg-opacity-50 px-5">
              <DrepProfileMetrics />
            </Grid>
          )}
        </Grid>
      </div>
    </div>
  );
};

export default page;
