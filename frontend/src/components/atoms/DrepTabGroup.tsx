import React from 'react';
import TabGroup, { TabItem } from './TabGroup';

const DrepTabGroup = ({ drepId }: { drepId: string }) => {
  const tabs: TabItem[] = [
    { id: 'profile', label: 'Profile', path: `/dreps/${drepId}` },
    { id: 'timeline', label: 'Timeline', path: `/dreps/${drepId}/timeline` },
    { id: 'votes', label: 'Votes', path: `/dreps/${drepId}/votes` },
    {
      id: 'delegators',
      label: 'Delegators',
      path: `/dreps/${drepId}/delegators`,
    },
  ];

  return <TabGroup tabs={tabs} defaultTab="profile" drepId={drepId}/>;
};

export default DrepTabGroup;
