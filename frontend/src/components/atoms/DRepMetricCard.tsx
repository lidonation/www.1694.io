import { Skeleton } from '@mui/material';
import dynamic from 'next/dynamic';

const Odometer = dynamic(() => import('react-odometerjs'), {
  ssr: false,
});

import 'odometer/themes/odometer-theme-default.css';
import { useEffect, useState } from 'react';


const AnimatedOdometer = ({ 
  value, 
  duration = 1000, 
  width = 80,
  height = 40, 
  className = "",
  isLoading = false  // Add isLoading prop
}) => {
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    setIsClientLoaded(true); 
    if (!isLoading) {
      setTimeout(() => {
        setDisplayValue(value);
      }, 500);
    }
  }, [value, isLoading]); 

  return (
    <div className={`relative ${className}`}>
      {(!isClientLoaded || isLoading) ? ( // Show skeleton while loading OR client mounting
        <Skeleton
          variant="rectangular"
          width={width}
          height={height}
          animation="wave"
          style={{ 
            borderRadius: '4px',
            margin: '0'
          }}
        />
      ) : (
        <Odometer 
          value={displayValue} 
          width={width}
          height={height}
          format="(,ddd)" 
          duration={duration} 
        />
      )}
    </div>
  );
};
export const MetricCard = ({ value, label, width = 80, height = 40, isLoading }) => (
  <td className="p-0.5">
    <div className=" flex items-start">
      <AnimatedOdometer 
        value={value} 
        width={width}
        height={height}
        className="text-xl font-black"
        isLoading={isLoading}
      />
    </div>
    <div className="text-xs text-wrap text-gray-500 min-h-[22px]"> 
      {label}
    </div>
  </td>
);
