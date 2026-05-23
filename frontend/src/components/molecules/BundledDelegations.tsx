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

  const isLeaving = bundleType === 'undelegation' || items.every(i => i.eventType === 'undelegation');

  return (
    <div className="flex flex-col gap-3 w-full">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border cursor-pointer transition-colors shadow-sm ${
          isLeaving
            ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        } ${isMobile ? 'scale-95 origin-left' : ''}`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`p-1.5 sm:p-2 rounded-lg ${isLeaving ? 'bg-orange-100' : 'bg-orange-100'}`}>
            <img src="/svgs/users-group.svg" className="w-4 h-4 sm:w-5 sm:h-5" alt="delegations" />
          </div>
          <div className="flex flex-col items-start text-left">
            <p className={`text-xs sm:text-sm font-bold leading-tight ${isLeaving ? 'text-orange-600' : 'text-gray-800'}`}>
              {items.length} {isLeaving ? 'Delegators Left' : 'New Delegators'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <p className="text-[10px] sm:text-xs font-medium text-orange-500">
            {isExpanded ? 'Collapse' : 'Expand'}
          </p>
          <img
            src="/svgs/chevron-down.svg"
            className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            alt="arrow"
          />
        </div>
      </div>

      {isExpanded && (
        <div className={`flex flex-col gap-4 pl-2 sm:pl-4 border-l-2 border-dashed py-2 ${isLeaving ? 'border-orange-200' : 'border-gray-200'}`}>
          {items.map((subItem) => (
            <div key={subItem.id} className="relative group">
              <div className="absolute -left-[16px] sm:-left-[25px] top-1/2 -translate-y-1/2 w-3 sm:w-4 h-[2px] bg-gray-200" />
              <div className={isMobile ? 'scale-90 origin-left -ml-4 w-[110%]' : ''}>
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
