import React from 'react';
import { useParams } from 'next/navigation';
import TabGroup, { TabItem } from '../atoms/TabGroup';

const VoterDashboardTabs = () => {
  const { voterId } = useParams();

  const tabs: TabItem[] = [
    { id: 'profile', label: 'Profile', path: `/voters/${voterId}` },
    { id: 'impact', label: 'Impact', path: `/voters/${voterId}/impact` },
  ];

  return <TabGroup tabs={tabs} defaultTab="profile" />;
};

export default VoterDashboardTabs;
