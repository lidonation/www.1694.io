import { shortNumberWithAnnotation } from '@/lib';
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
  className = '',
  isLoading = false,
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
      {!isClientLoaded || isLoading ? (
        <Skeleton
          variant="rectangular"
          width={width}
          height={height}
          animation="wave"
          style={{
            borderRadius: '4px',
            margin: '0',
          }}
        />
      ) : (
        <div className="flex items-center">
          <Odometer
            value={shortNumberWithAnnotation(displayValue).numValue}
            width={width}
            height={height}
            format="(ddd).dd"
            duration={duration}
          />
          <p className="self-center">
            {shortNumberWithAnnotation(displayValue).annotation}
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
  <td className="w-32 px-2 py-3 text-left">
    <div className="flex items-start">
      <AnimatedOdometer
        value={value}
        width={width}
        height={height}
        className="text-xl font-black"
        isLoading={isLoading}
      />
    </div>
    <div className="min-h-5 text-wrap text-xs text-gray-500">{label}</div>
  </td>
);
