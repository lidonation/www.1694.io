import { Skeleton } from '@mui/material';
import dynamic from 'next/dynamic';

const Odometer = dynamic(() => import('react-odometerjs'), {
  ssr: false,
});

import 'odometer/themes/odometer-theme-default.css';
import { useEffect, useState } from 'react';
function shortNumber(value: number, decimals: number = 2) {
  switch (true) {
    case Math.abs(Number(value)) >= 1.0e9:
      return {
        numValue: Number((Math.abs(Number(value)) / 1.0e9).toFixed(decimals)),
        annotation: 'B',
      };
    case Math.abs(Number(value)) >= 1.0e6:
      return {
        numValue: Number((Math.abs(Number(value)) / 1.0e6).toFixed(decimals)),
        annotation: 'M',
      };
    case Math.abs(Number(value)) >= 1.0e3:
      return {
        numValue: Number((Math.abs(Number(value)) / 1.0e3).toFixed(decimals)),
        annotation: 'K',
      };
    default:
      return {
        numValue: Math.abs(Number(value)),
        annotation: '',
      };
  }
}

const AnimatedOdometer = ({
  value,
  duration = 1000,
  width = 80,
  height = 40,
  className = '',
  isLoading = false, // Add isLoading prop
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
        <div className='flex items-center'>
          <Odometer
            value={shortNumber(displayValue).numValue}
            width={width}
            height={height}
            format="(ddd).dd"
            duration={duration}
          />
          <p className='self-center'>
            {shortNumber(displayValue).annotation}
          </p>
        </div>
      )}
    </div>
  );
};
export const MetricCard = ({
  value,
  label,
  width = 80,
  height = 40,
  isLoading,
}) => (
  <td className="w-32 px-1 py-0.5 text-left">
    <div className="flex items-start">
      <AnimatedOdometer
        value={value}
        width={width}
        height={height}
        className="text-xl font-black"
        isLoading={isLoading}
      />
    </div>
    <div className="min-h-[22px] text-wrap text-xs text-gray-500">{label}</div>
  </td>
);
