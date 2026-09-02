import React, { useMemo } from 'react';
import TabGroup, { TabItem } from './TabGroup';
import { useLocale } from 'next-intl';
import { getDrepLastTabKey } from '@/lib/localStorage';

const DrepTabGroup = ({ drepId }: { drepId: string }) => {
  const locale = useLocale();
  const tabKey = getDrepLastTabKey(drepId);

  const tabs: TabItem[] = useMemo(
    () => [
      { id: 'profile', label: 'Profile', path: `/${locale}/dreps/${drepId}` },
      {
        id: 'timeline',
        label: 'Timeline',
        path: `/${locale}/dreps/${drepId}/timeline`,
      },
      { id: 'votes', label: 'Votes', path: `/${locale}/dreps/${drepId}/votes` },
      {
        id: 'delegators',
        label: 'Delegators',
        path: `/${locale}/dreps/${drepId}/delegators`,
      },
    ],
    [locale, drepId],
  );

  const handleTabChange = ({
    activeTab,
    storedTab,
  }: {
    activeTab: string;
    storedTab: string | null;
  }) => {
    if (storedTab) {
      localStorage.setItem(tabKey, activeTab);
    } else {
      localStorage.removeItem(tabKey);
    }
  };

  return (
    <TabGroup tabs={tabs} defaultTab="profile" onTabChange={handleTabChange} />
  );
};

export default DrepTabGroup;
