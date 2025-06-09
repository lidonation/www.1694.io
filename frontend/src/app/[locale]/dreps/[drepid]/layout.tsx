'use client';
import DRepProfileBar from '@/components/atoms/DrepProfileBar';
import DrepTabGroup from '@/components/atoms/DrepTabGroup';
import { useState } from 'react';
import { Box, Grow } from '@mui/material';
import { useGetSingleDRepQuery } from '@/hooks/useGetSingleDRepQuery';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import NotFound from './not-found';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import { useWallet } from '@/context/globalContext';
import { convertDrepPhraseToCIP105Legacy } from '@/lib';

export default function Layout({ children }: { children: React.ReactNode }) {
  const {
    user: { dRepProfilesClaimed },
  } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const { drepid } = useParams();
  const locale = useLocale();
  const { dRep, isDRepLoading, fetchError } = useGetSingleDRepQuery(
    drepid.toString(),
  );
  const isOwner = dRepProfilesClaimed?.some(
    (drep) =>
      drep.claimedDRepBech32 ===
      convertDrepPhraseToCIP105Legacy(drepid.toString()),
  );

  const currentUserIsDrepOwner = dRep?.drep_id && isOwner;

  if (!isDRepLoading && fetchError?.response?.status === 404) {
    return (
      <Grow in={true}>
        <Box>
          <NotFound />
        </Box>
      </Grow>
    );
  }

  return (
    <Box>
      <BreadCrumbs
        crumbs={[
          {
            label: 'DReps',
            href: `/${locale}/dreps`,
          },
          {
            label: 'DReps List',
            href: `/${locale}/dreps/list`,
          },
          {
            label: `DRep (${drepid})`,
            href: `/${locale}/dreps/${drepid}`,
          },
        ]}
      />
      <Box className="flex">
        {currentUserIsDrepOwner && (
          <DRepProfileBar isOpen={isOpen} setIsOpen={setIsOpen} />
        )}
        <Box className="base_container my-5 flex h-full w-full flex-col shadow-sm">
          <Box className="sticky top-0 z-10 w-full bg-blue-50">
            <DrepTabGroup drepId={drepid as string} />
          </Box>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
