'use client';
import DRepProfileBar from '@/components/atoms/DrepProfileBar';
import DrepProfileCard from '@/components/atoms/DrepProfileCard';
import DrepTabGroup from '@/components/atoms/DrepTabGroup';
import { useEffect, useState } from 'react';
import { Grid } from '@mui/material';
import DrepTimeline from '@/components/molecules/DrepTimeline';
import DrepProfileMetrics from '@/components/molecules/DrepProfileMetrics';
import DrepClaimProfileCard from '@/components/atoms/DrepClaimProfileCard';
import { useParams } from 'next/navigation';
import { getSingleDRep } from '@/services/requests/getSingleDrep';

const page = () => {
  const [currentTab, setCurrentTab] = useState('profile');
  const { drepid } = useParams();
  useEffect(() => {
    if (drepid) {
      const getDrepData = async (drepid: number) => {
        const res = await getSingleDRep(drepid);
        console.log(res)
      };

      getDrepData(Number(drepid));
    }
  }, []);
  return (
    <div className="flex">
      <DRepProfileBar />
      <Grid container style={{ height: '100%' }}>
        {currentTab === 'profile' && <Grid item xs={3}></Grid>}
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
  );
};

export default page;
