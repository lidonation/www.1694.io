import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import { setItemToLocalStorage, DREP_LAST_TAB_LS_KEY } from '@/lib/localStorage';

export type TabItem = {
  id: string;
  label: string;
  path: string;
};

interface TabGroupProps {
  tabs: TabItem[];
  defaultTab?: string;
  className?: string;
}

const TabGroup: React.FC<TabGroupProps> = ({
  tabs,
  defaultTab = tabs[0]?.id,
  className = '',
}) => {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLAnchorElement>(null);

  const activeTab =
    tabs.find((tab) =>
      tab.id === defaultTab
        ? pathname === tab.path
        : pathname.includes(tab.path),
    )?.id || defaultTab;

  useEffect(() => {
    setItemToLocalStorage(DREP_LAST_TAB_LS_KEY, activeTab);
  }, [activeTab]);

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
  }, [activeTab]);

  return (
    <Box
      ref={containerRef}
      className={`flex w-full items-center justify-start overflow-x-auto lg:justify-center ${className}`}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          ref={tab.id === activeTab ? activeTabRef : null}
          href={tab.path}
          prefetch={true}
          scroll={false}
          className={`px-16 py-4 transition-colors duration-200 focus:outline-none ${
            activeTab === tab.id
              ? 'rounded-t-lg border-b-2 border-blue-800 bg-white text-blue-800'
              : 'rounded-t-lg bg-blue-50 text-gray-500 hover:text-gray-800'
          } `}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </Box>
  );
};

export default TabGroup;
