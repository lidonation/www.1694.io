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
  format = "(,ddd).d",
  className = "",
  width,
  height,
}: AnimatedCounterProps) => {
  const spring = useSpring(0, { 
    damping: 60, 
    stiffness: 100,
    duration: duration 
  });
  
  const display = useTransform(spring, (current) =>
    formatNumber(Math.round(current), format)
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  const formatNumber = (num: number, formatStr: string): string => {
    if (formatStr.includes('(,ddd)')) {
      const parts = num.toString().split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      
      if (formatStr.includes('.d')) {
        return parts.length > 1 ? parts.join('.') : parts[0] + '.0';
      } else if (formatStr.includes('.dd')) {
        const decimal = parts.length > 1 ? parts[1].padEnd(2, '0').substring(0, 2) : '00';
        return parts[0] + '.' + decimal;
      }
      
      return parts[0];
    }
    
    return num.toString();
  };

  const style = {
    ...(width && { width: `${width}px` }),
    ...(height && { height: `${height}px` }),
  };

  return (
    <motion.span 
      className={className}
      style={style}
    >
      {display}
    </motion.span>
  );
};