'use client';
import React from 'react';
import { useScreenDimension } from '@/hooks';
import DrepDelegatorCard from '@/components/atoms/DrepDelegatorCard';
import { Delegation } from '../../../types/timeline';

interface BundledDelegationsProps {
  items: Delegation[];
  bundleType?: 'delegation' | 'undelegation';
}

const BundledDelegations = ({ items, bundleType }: BundledDelegationsProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { isMobile } = useScreenDimension();

  const isLeaving =
    bundleType === 'undelegation' ||
    items.every((i) => i.eventType === 'undelegation');

  return (
    <div className="flex w-full flex-col gap-3">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 shadow-sm transition-colors sm:p-4 ${
          isLeaving
            ? 'border-orange-200 bg-orange-50 hover:bg-orange-100'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
        } ${isMobile ? 'origin-left scale-95' : ''}`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`rounded-lg p-1.5 sm:p-2 ${isLeaving ? 'bg-orange-100' : 'bg-orange-100'}`}
          >
            <img
              src="/svgs/users-group.svg"
              className="h-4 w-4 sm:h-5 sm:w-5"
              alt="delegations"
            />
          </div>
          <div className="flex flex-col items-start text-left">
            <p
              className={`text-xs leading-tight font-bold sm:text-sm ${isLeaving ? 'text-orange-600' : 'text-gray-800'}`}
            >
              {items.length} {isLeaving ? 'Delegators Left' : 'New Delegators'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <p className="text-[10px] font-medium text-orange-500 sm:text-xs">
            {isExpanded ? 'Collapse' : 'Expand'}
          </p>
          <img
            src="/svgs/chevron-down.svg"
            className={`h-3 w-3 transition-transform duration-300 sm:h-4 sm:w-4 ${isExpanded ? 'rotate-180' : ''}`}
            alt="arrow"
          />
        </div>
      </div>

      {isExpanded && (
        <div
          className={`flex flex-col gap-4 border-l-2 border-dashed py-2 pl-2 sm:pl-4 ${isLeaving ? 'border-orange-200' : 'border-gray-200'}`}
        >
          {items.map((subItem) => (
            <div key={subItem.id} className="group relative">
              <div className="absolute top-1/2 -left-[16px] h-[2px] w-3 -translate-y-1/2 bg-gray-200 sm:-left-[25px] sm:w-4" />
              <div
                className={
                  isMobile ? '-ml-4 w-[110%] origin-left scale-90' : ''
                }
              >
                <DrepDelegatorCard item={subItem as any} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BundledDelegations;
