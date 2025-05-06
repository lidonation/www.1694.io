import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type TabItem = {
  id: string;
  label: string;
  path: string;
};

const DrepTabGroup = ({ drepId }: { drepId: string }) => {
  const router = useRouter();
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

  const handleTabClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="flex items-center overflow-x-auto">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.path}
          onClick={() => handleTabClick(tab.path)}
          prefetch={true}
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
