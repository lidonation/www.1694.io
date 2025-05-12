import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type TabItem = {
  id: string;
  label: string;
  path: string;
};

const DrepTabGroup = ({ drepId }: { drepId: string }) => {
  const pathname = usePathname();

  const tabs: TabItem[] = [
    { id: 'profile', label: 'Profile', path: `/dreps/${drepId}` },
    { id: 'timeline', label: 'Timeline', path: `/dreps/${drepId}/timeline` },
    {
      id: 'delegators',
      label: 'Delegators',
      path: `/dreps/${drepId}/delegators`,
    },
  ];

  const activeTab =
    tabs.find((tab) =>
      tab.id === 'profile'
        ? pathname === tab.path
        : pathname.includes(tab.path),
    )?.id || 'profile';

  return (
    <div className="flex w-full items-center justify-start overflow-x-auto lg:justify-center">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.path}
          prefetch={true}
          scroll={false}
          className={`px-16 py-4 transition-colors duration-200 focus:outline-none
            ${
              activeTab === tab.id
                ? 'rounded-t-lg border-b-2 border-blue-800 bg-white text-blue-800'
                : 'rounded-t-lg bg-blue-50 text-gray-500 hover:text-gray-800'
            }`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
};

export default DrepTabGroup;
