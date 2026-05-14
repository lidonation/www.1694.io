'use client';
import React from 'react';
import { useScreenDimension } from '@/hooks';
import DrepDelegatorCard from '@/components/atoms/DrepDelegatorCard';
import { Delegation } from '../../../types/timeline';

interface BundledDelegationsProps {
  items: Delegation[];
}

const BundledDelegations = ({ items }: BundledDelegationsProps) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { isMobile } = useScreenDimension();
  
  const delegationsCount = items.filter(i => i.eventType !== 'undelegation').length;
  const undelegationsCount = items.filter(i => i.eventType === 'undelegation').length;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors shadow-sm ${isMobile ? 'scale-95 origin-left' : ''}`}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
            <img src="/svgs/users-group.svg" className="w-4 h-4 sm:w-5 sm:h-5" alt="delegations" />
          </div>
          <div className="flex flex-col items-start text-left">
            <p className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">
              {items.length} Delegation Events
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500">
              {delegationsCount} New{undelegationsCount > 0 ? `, ${undelegationsCount} Left` : ''}
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
        <div className="flex flex-col gap-4 pl-2 sm:pl-4 border-l-2 border-dashed border-gray-200 py-2">
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
