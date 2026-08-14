'use client';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: string;
  className?: string;
  width?: number;
  height?: number;
}

export const AnimatedCounter = ({
  value,
  duration = 1000,
  format = '(,ddd).d',
  className = '',
  width,
  height,
}: AnimatedCounterProps) => {
  // Move formatNumber function before it's used
  const formatNumber = (num: number, formatStr: string): string => {
    if (formatStr.includes('(,ddd)')) {
      const dotIndex = formatStr.indexOf('.');
      const decimalCount =
        dotIndex !== -1 ? formatStr.substring(dotIndex + 1).length : 0;

      const fixedNum = num.toFixed(decimalCount);
      const parts = fixedNum.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

      return parts.length > 1 ? parts.join('.') : parts[0];
    }

    return num.toString();
  };

  const spring = useSpring(0, {
    damping: 60,
    stiffness: 100,
    duration: duration,
  });

  const display = useTransform(spring, (current) =>
    formatNumber(current, format),
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  const style = {
    ...(width && { width: `${width}px` }),
    ...(height && { height: `${height}px` }),
  };

  const MotionSpan = motion.span as any;

  return (
    <MotionSpan className={className || undefined} style={style}>
      {display}
    </MotionSpan>
  );
};
