'use client';
import { shortNumberWithAnnotation } from '@/lib';
import { Skeleton } from '@mui/material';
import { useEffect, useState } from 'react';
import { AnimatedCounter } from './AnimatedCounter';

export const AnimatedOdometer = ({
  value,
  duration = 1000,
  width = 80,
  height = 40,
  className = '',
  isLoading = false,
  format = '(,ddd).dd',
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
        <div className="flex items-center justify-center gap-0.5">
          <AnimatedCounter
            value={shortNumberWithAnnotation(displayValue).numValue}
            format={format}
            duration={duration}
            className="font-black"
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
    <div className="min-h-5 text-xs text-wrap text-gray-500">{label}</div>
  </td>
);
