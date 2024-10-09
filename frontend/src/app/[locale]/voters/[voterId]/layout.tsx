'use client';
import { Background } from '@/components/atoms/Background';
import Footer from '@/components/atoms/Footer';
import { Header } from '@/components/atoms/Header';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import VoterDashboardTabs from '@/components/voters/VoterDashboardTabs';
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
      <div className="base_container mt-4 w-full">
        <VoterDashboardTabs />
        {children}
      </div>
      <Footer />
    </Background>
  );
};

export default layout;
