'use client';
import DRepProfileBar from '@/components/atoms/DrepProfileBar';
import DrepTabGroup from '@/components/atoms/DrepTabGroup';
import { useState, useEffect } from 'react';
import { Box, Grow } from '@mui/material';
import { useGetSingleDRepQuery } from '@/hooks/useGetSingleDRepQuery';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import NotFound from './not-found';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import { useWallet } from '@/context/globalContext';
import { convertDrepPhraseToCIP105Legacy } from '@/lib';
import { DREP_LAST_TAB_LS_KEY, getItemFromLocalStorage, setItemToLocalStorage } from '@/lib/localStorage';

export default function Layout({ children }: { children: React.ReactNode }) {
  const {
    user: { dRepProfilesClaimed },
  } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const { drepid } = useParams();
  const pathname = usePathname();
  const router = useRouter();
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

  useEffect(() => {
    if (!pathname || !drepid || !locale) {
      return;
    }  
    const cleanedPathname = pathname.replace(/\/+$/, '').toLowerCase();
    const cleanDrepId = Array.isArray(drepid)
      ? drepid[0].toLowerCase()
      : drepid.toString().toLowerCase();
    const expectedDrepRootPath = `/${locale}/dreps/${cleanDrepId}`;
    let isRedirected = false;

    if (cleanedPathname === expectedDrepRootPath && !isRedirected) {
      const lastVisitedTab = getItemFromLocalStorage(DREP_LAST_TAB_LS_KEY);
      const validTabs = ['timeline', 'votes', 'delegators'];

      if (lastVisitedTab && validTabs.includes(lastVisitedTab)) {
        const targetPath = `/${locale}/dreps/${cleanDrepId}/${lastVisitedTab}`;
        isRedirected = true;
        setTimeout(() => {
          try {
            router.replace(targetPath, { scroll: false });
          } catch (error) {
            router.push(targetPath, { scroll: false });
          }
        }, 100); 
      } else {
        setItemToLocalStorage(DREP_LAST_TAB_LS_KEY, 'profile');
      }
    }

    return () => {
      isRedirected = false; 
    };
  }, [pathname, drepid, locale]);

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
        {/* If current user is a drep, the drawer will be available for use */}
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
