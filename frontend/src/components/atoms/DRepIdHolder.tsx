import { Skeleton } from '@mui/material';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import React from 'react';
import { convertString } from '@/lib';
type DRepIdHolderProps = {
  loading: boolean;
  drepId: string;
  isCIP129: boolean;
  className?: string;
};
function DRepIdHolder({
  loading,
  drepId,
  isCIP129,
  className,
}: DRepIdHolderProps) {
  return (
    <div className={`flex w-full justify-between ${className}`}>
      <p className="w-full">
        <span className="text-sm">{isCIP129 ? '(CIP-129)' : '(Legacy)'} </span>
        {loading ? (
          <Skeleton animation="wave" className="h-5 w-2/3" />
        ) : (
          convertString(drepId || '', true)
        )}
      </p>
      <CopyToClipboard
        text={drepId}
        
        onCopy={() => {
          console.log('copied!');
        }}
        className={`clipboard-text flex-shrink-0 cursor-pointer rounded-xl px-1 hover:bg-blue-100 ${loading && 'hidden'}`}
      >
        <img src="/svgs/copy.svg" alt="copy" />
      </CopyToClipboard>
    </div>
  );
}

export default DRepIdHolder;
