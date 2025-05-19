import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';

type TabItem = {
  id: string;
  label: string;
  path: string;
};

const DrepTabGroup = ({ drepId }: { drepId: string }) => {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  const tabs: TabItem[] = [
    { id: 'profile', label: 'Profile', path: `/dreps/${drepId}` },
    { id: 'timeline', label: 'Timeline', path: `/dreps/${drepId}/timeline` },
    { id: 'votes', label: 'Votes', path: `/dreps/${drepId}/votes` },
    { id: 'delegators', label: 'Delegators', path: `/dreps/${drepId}/delegators` },
  ];

  const activeTab = tabs.find((tab) =>
    tab.id === 'profile' ? pathname === tab.path : pathname.includes(tab.path),
  )?.id || 'profile';

  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeElement = activeTabRef.current;
      
      const containerWidth = container.offsetWidth;
      const elementWidth = activeElement.offsetWidth;
      const elementLeft = activeElement.offsetLeft;
      
      const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
  }, [activeTab]);

  return (
    <Box 
      ref={containerRef}
      className="flex w-full items-center justify-start overflow-x-auto lg:justify-center"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          ref={activeTab === tab.id ? activeTabRef : null}
          href={tab.path}
          prefetch={true}
          scroll={false}
          className={`px-16 py-4 transition-colors duration-200 focus:outline-none ${
            activeTab === tab.id
              ? 'rounded-t-lg border-b-2 border-blue-800 bg-white text-blue-800'
              : 'rounded-t-lg bg-blue-50 text-gray-500 hover:text-gray-800'
          }`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </Box>
  );
};

export default DrepTabGroup;