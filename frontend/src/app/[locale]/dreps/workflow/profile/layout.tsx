'use client';
import SetupProgressBar from '@/components/atoms/SetupProgressBar';
import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDRepContext } from '@/context/drepContext';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import { useCardano } from '@/context/walletContext';

interface Props {
  children?: React.ReactNode;
}

const Layout = ({ children }: Props) => {
  const pathname = usePathname();
  const {
    currentLocale,
    isLoggedIn,
    setLoginModalOpen,
    loginModalOpen,
    isWalletListModalOpen,
    setHideCloseButtonOnLoginModal,
    setHideCloseButtonOnWalletListModal,
  } = useDRepContext();
  const { addWarningAlert } = useGlobalNotifications();
  const { dRepIDBech32 } = useCardano();

  useEffect(() => {
    if (
      !isLoggedIn &&
      !isWalletListModalOpen &&
      pathname.includes(`/${currentLocale}/dreps/workflow/profile/update`)
    ) {
      setLoginModalOpen(true);
      setHideCloseButtonOnLoginModal(true);
    }
    if ((isLoggedIn && loginModalOpen) || isWalletListModalOpen) {
      setLoginModalOpen(false);
      setHideCloseButtonOnWalletListModal(true);
      setHideCloseButtonOnLoginModal(false);
    }
  }, [loginModalOpen, isLoggedIn, isWalletListModalOpen]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      addWarningAlert(
        'Changes made will be stored locally, until you submit onchain',
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const generateCrumbs = () => {
    const pathSegments = pathname
      .split('/')
      .filter(
        (segment) =>
          segment !== '' && segment !== 'en' && segment !== 'workflow',
      );

    const crumbs = [];
    const customUrls = {
      dreps: '/en/dreps',
      profile: `/en/dreps/${dRepIDBech32}`,
      new: '/en/dreps/workflow/profile/new',
      update: '/en/dreps/workflow/profile/update/step1',
      success: '/en/dreps/workflow/profile/success',
    };

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);

      if (segment === 'dreps') label = 'DReps';
      if (segment === 'profile') label = 'DRep';
      if (segment === 'new') label = 'New';
      if (segment === 'update') label = 'Update';
      if (segment === 'success') label = 'Success';
      if (
        segment === 'new' &&
        crumbs.length > 0 &&
        crumbs[crumbs.length - 1].label === 'DRep'
      ) {
        crumbs.pop();
      }

      crumbs.push({
        label,
        href: customUrls[segment] || pathname,
      });
    }

    return crumbs;
  };

  const crumbs = generateCrumbs();

  return (
    <div>
      <BreadCrumbs crumbs={crumbs} />
      <div className="form_container bg-white px-2 py-10 lg:px-5 mt-6">
        <div className="flex w-full flex-col items-center justify-center gap-2">
          {pathname !== `/${currentLocale}/dreps/workflow/profile/success` && (
            <SetupProgressBar />
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
