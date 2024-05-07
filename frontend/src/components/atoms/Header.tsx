import React, { useEffect, useState } from 'react';
import { useCardano } from '@/context/walletContext';
import WalletConnectButton from '@/components/molecules/WalletConnectButton';
import { WalletInfoCard } from '@/components/molecules';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDRepContext } from '@/context/drepContext';
import TranslationBlock from '../1694.io/TranslationBlock';

const Header = () => {
  const { isEnabled } = useCardano();
  const { currentLocale } = useDRepContext();
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState(null);

  useEffect(() => {
    // Setting the active link based on the current pathname
    setActiveLink(pathname);
  }, [pathname]);

  return (
    <header className="bg-white bg-opacity-50">
      <div className="container flex flex-row items-center justify-between py-6">
        <Link href='/'>
          <img src="/sancho1694.svg" alt="Sancho logo" width={'40%'} />
        </Link>
        <div className="flex items-center gap-6 text-nowrap text-sm font-bold">
          <Link
            href="/dreps"
            className={
              activeLink === `/${currentLocale}/dreps` ? 'text-orange-500' : ''
            }
          >
            What are DReps
          </Link>
          <Link
            href="/dreps/list"
            className={
              activeLink === `/${currentLocale}/dreps/list`
                ? 'text-orange-500'
                : ''
            }
          >
            DRep List
          </Link>
          <Link
            href="/dreps/notes"
            className={
              activeLink === `/${currentLocale}/dreps/notes`
                ? 'text-orange-500'
                : ''
            }
          >
            Notes
          </Link>
          <Link href="#">Ecosystem</Link>
          <div>
            {activeLink !== `/${currentLocale}` && !isEnabled ? (
              <WalletConnectButton test_name={'header'} />
            ) : (
              <WalletInfoCard />
            )}
          </div>
          <div className="cursor-pointer">
            <img src="/bell.svg" alt="Notifs" />
          </div>
        </div>
      </div>
      <TranslationBlock />
    </header>
  );
};

export default Header;
