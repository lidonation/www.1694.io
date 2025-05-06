import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { convertString } from '@/lib';
import React from 'react';

interface CopyToClipboardProps {
  text: string;
  children: React.ReactNode;
  className?: string;
  textStyles?: string;
  truncate?: boolean;
  textToPrecede?: boolean;
}

const CopyToClipboard = ({
  text,
  children,
  className,
  truncate,
  textStyles,
  textToPrecede,
}: CopyToClipboardProps) => {
  const { addSuccessAlert } = useGlobalNotifications();
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    addSuccessAlert('Copied to clipboard');
  };
  
  return (
    <div
      className={`clipboard-text flex cursor-pointer gap-1 ${className} ${textToPrecede ? 'flex-row-reverse' : 'flex-row'}`}
      onClick={handleCopy}
    >
      <p className={`break-all max-w-full ${textStyles || ''}`}>
        {truncate ? convertString(text, true) : text}
      </p>
      {children}
    </div>
  );
};

export default CopyToClipboard;