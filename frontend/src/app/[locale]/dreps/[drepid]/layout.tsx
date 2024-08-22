'use client';
import DRepProfileBar from '@/components/atoms/DrepProfileBar';
import DrepTabGroup from '@/components/atoms/DrepTabGroup';
import { useState } from 'react';
import { IconButton } from '@mui/material';
import { useCardano } from '@/context/walletContext';
import { useGetSingleDRepQuery } from '@/hooks/useGetSingleDRepQuery';
import { useParams } from 'next/navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { dRepIDBech32 } = useCardano();
  const [isOpen, setIsOpen] = useState(false);
  const { drepid } = useParams();
  const { dRep } = useGetSingleDRepQuery(drepid);

  return (
    <div className="flex">
      {/* If current user is a drep, the drawer will be available for use */}
      {dRep?.drep_id && dRep?.cexplorerDetails?.view == dRepIDBech32 && (
        <DRepProfileBar isOpen={isOpen} setIsOpen={setIsOpen} />
      )}
      <div className="base_container w-full">
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-start sticky top-0 bg-blue-50 z-10">
            <div className="w-[30%]">
              {dRep?.drep_id &&
                dRep?.cexplorerDetails?.view == dRepIDBech32 && (
                  <IconButton
                    data-testid="close-drawer-button"
                    onClick={() => {
                      setIsOpen(!isOpen);
                    }}
                  >
                    <img
                      width={'50%'}
                      className="shrink-0"
                      src={'/svgs/menu.svg'}
                    />
                  </IconButton>
                )}
            </div>
            <div className="w-[70%]">
              <DrepTabGroup drepId={drepid as string}/>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}