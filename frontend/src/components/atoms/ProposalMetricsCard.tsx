'use client';
import { Skeleton } from '@mui/material';
import { useEffect, useState } from 'react';
import { 
  ProposalAnimatedMetricProps as AnimatedMetricProps,
  ProposalMetricsCardProps as MetricsCardProps 
} from '../../../types/commonTypes';
import { AnimatedCounter } from './AnimatedCounter';

const AnimatedMetric = ({
  value,
  isAda = false,
  isPercentage = false,
  isBillion = false,
  isThousand = false,
  isMillion = false,
  duration = 1000,
  isLoading = false,
}: AnimatedMetricProps) => {
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    setIsClientLoaded(true);
    if (!isLoading) {
      setTimeout(() => setDisplayValue(value), 50);
    }
  }, [value, isLoading]);

  if (!isClientLoaded || isLoading) {
    return (
      <Skeleton
        variant="rectangular"
        width={100}
        height={40}
        animation="wave"
        className="rounded"
        style={{ 
          borderRadius: '4px',
          margin: '0'
        }}
      />
    );
  }

  if (isPercentage) {
    return (
      <div className="flex items-baseline">
        <AnimatedCounter value={Math.round(displayValue * 100)} duration={duration} />
        <span className="ml-1">%</span>
      </div>
    );
  }

  const formatWithSuffix = (val: number) => {
    if (isPercentage) {
      return { value: Math.round(val * 100), suffix: '%' };
    }

    if (isBillion) {
      return { value: val / 1_000_000_000, suffix: 'B' };
    }
    
    if (isMillion) {
      return { value: val / 1_000_000, suffix: 'M' };
    }
    
    if (isThousand) {
      return { value: val / 1_000, suffix: 'k' };
    }

    return { value: val, suffix: '' };
  };

  const { value: scaledValue, suffix } = formatWithSuffix(displayValue);

  const formattedValue =
  typeof scaledValue === 'number' && !isNaN(scaledValue)
    ? (Number.isInteger(scaledValue) ? scaledValue : parseFloat(scaledValue.toFixed(1)))
    : 0;

  return (
    <div className="flex items-baseline">
      <AnimatedCounter 
        value={formattedValue} 
        duration={duration} 
        format="(,ddd).d" 
      />
      {suffix && <span className="ml-1">{suffix}</span>}
      {isAda && <span className="ml-1">₳</span>}
    </div>
  );
};

export const MetricsCard = ({
    value,
    label,
    isAda = false,
    isPercentage = false,
    isBillion = false,
    isThousand = false,
    tooltip = '',
    isLoading = false,
    isMillion = false,
  }: MetricsCardProps) => (
    <div className="flex flex-col">
      <div className="text-2xl font-bold text-gray-900">
        <AnimatedMetric
          value={value}
          isAda={isAda}
          isPercentage={isPercentage}
          isBillion={isBillion}
          isThousand={isThousand}
          isLoading={isLoading}
          isMillion={isMillion}
        />
      </div>
      <div className="mt-1 text-sm font-medium text-gray-500">
        {label}
        {tooltip && (
          <span className="ml-1 text-gray-400 cursor-help" title={tooltip}>
            (?)
          </span>
        )}
      </div>
    </div>
  );