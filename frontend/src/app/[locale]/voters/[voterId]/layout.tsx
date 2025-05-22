'use client';
import { Background } from '@/components/atoms/Background';
import Footer from '@/components/atoms/Footer';
import { Header } from '@/components/atoms/Header';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import VoterDashboardTabs from '@/components/voters/VoterDashboardTabs';
import { Box } from '@mui/material';
import { useParams } from 'next/navigation';
import React from 'react';

const layout = ({ children }: { children: React.ReactNode }) => {
  const { voterId } = useParams();
  return (
    <Background>
      <Header />
      <BreadCrumbs
        crumbs={[
          {
            label: `Voter (${voterId})`,
            href: `/voters/${voterId}`,
          },
        ]}
      />
      <Box className="base_container my-5 flex h-full w-full flex-col shadow-sm">
        <Box className="sticky top-0 z-10 w-full bg-blue-50">
          <VoterDashboardTabs />
        </Box>
        {children}
      </Box>
      <Footer />
    </Background>
  );
};

export default layout;
