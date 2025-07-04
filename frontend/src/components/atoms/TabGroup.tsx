'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';

export type TabItem = {
  id: string;
  label: string;
  path: string;
};

interface TabGroupProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabInfo: { activeTab: string; storedTab: string | null }) => void;
}

const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  defaultTab = tabs[0]?.id || 'profile',
  className = '',
  onTabChange,
}) => {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  const pathnameSegments = pathname.split('/').filter(Boolean);
  const currentTabSegment = pathnameSegments[pathnameSegments.length - 1];
  const tabIds = tabs.map((tab) => tab.id);
  const activeTab = tabIds.includes(currentTabSegment) ? currentTabSegment : defaultTab;

  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeElement = activeTabRef.current;

      const containerWidth = container.offsetWidth;
      const elementWidth = activeElement.offsetWidth;
      const elementLeft = activeElement.offsetLeft;

      const scrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }

    const storedTab = tabIds.includes(currentTabSegment) ? activeTab : null;

    onTabChange?.({ activeTab, storedTab });
  }, [activeTab, pathname, tabs, onTabChange]);

  return (
    <Box
      ref={containerRef}
      className={`flex w-full items-center justify-start overflow-x-auto lg:justify-center ${className}`}
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

export default TabGroup;
