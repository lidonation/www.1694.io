import React, { useEffect, useState } from 'react';
import { useCardano } from '@/context/walletContext';
import WalletConnectButton from '@/components/molecules/WalletConnectButton';
import { WalletInfoCard } from '@/components/molecules';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDRepContext } from '@/context/drepContext';
import TranslationBlock from '../1694.io/TranslationBlock';
import { useScreenDimension } from '@/hooks';
import LoginButton from '../molecules/LoginButton';
import { LoginInfoCard } from '../molecules/LoginInfoCard';
import Button from './Button';

const navOptions = [
  {
    name: 'DReps',
    path: '/dreps',
  },
  {
    name: 'DRep List',
    path: '/dreps/list',
  },
  {
    name: 'Notes',
    path: '/dreps/notes',
  },
  {
    name: 'Ecosystem',
    path: '/ecosystem',
  },
];
const Header = () => {
  const { isEnabled } = useCardano();
  const {
    currentLocale,
    setIsMobileDrawerOpen,
    isLoggedIn,
    setLoginModalOpen,
  } = useDRepContext();
  const { isMobile } = useScreenDimension();
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState(null);
  useEffect(() => {
    // Setting the active link based on the current pathname
    setActiveLink(pathname);
  }, [pathname]);
  //add event listener to the window to check if the screen is mobile
  return (
    <header className="w-full bg-white bg-opacity-50">
      <div className="base_container flex shrink-0 flex-row items-center justify-between py-6 ">
        <Link href="/">
          <img
            src="/sancho1694.svg"
            alt="Sancho logo"
            width={isMobile ? 100 : 150}
          />
        </Link>
      </div>
    </header>
  );
};

export { Header, navOptions };
