import React, { useCallback, useEffect, useState } from 'react';
import { useCardano } from '@/context/cardanoContext';
import WalletConnectButton from '@/components/molecules/WalletConnectButton';
import { WalletInfoCard } from '@/components/molecules';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDRepContext } from '@/context/drepContext';
import { useScreenDimension } from '@/hooks';
import VoltaireMenu from '../molecules/VoltaireMenu';
import DRepMenu from '../molecules/DRepMenu';
import { SliderMenu } from '../organisms/SliderMenu';
import NotificationDrawer from '@/components/molecules/NotificationDrawer';
import { CONFIGURED_NETWORK_NAME } from '@/constants';
import { useWallet } from '@/context/walletContext';

const Header = () => {
  const { wallet:{isConnected} } = useWallet();
  const [networkName, setNetworkName] = useState('');
  const { currentLocale } = useDRepContext();
  const { isMobile } = useScreenDimension();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const pathname = usePathname();
  const [activeLink, setActiveLink] = useState(null);
  useEffect(() => {
    setNetworkName(CONFIGURED_NETWORK_NAME);
  }, [CONFIGURED_NETWORK_NAME]);
  const renderLogoOnNetworkChange = useCallback(() => {
    if (networkName) {
      switch (networkName) {
        case 'sanchonet':
          return '/img/logos/sancho-black.png';
        case 'mainnet':
          return '/img/logos/mainnet-black.png';
        case 'preview':
          return '/img/logos/preview-black.png';
        default:
          return '/img/logos/sancho-black.png';
      }
    }
    // Default to voltaire logo
    return '/img/logos/voltaire-black.png';
  }, [networkName]);
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
            src={renderLogoOnNetworkChange()}
            alt="1694 logo"
            width={isMobile ? 100 : 150}
          />
        </Link>
        <div className="flex shrink-0 items-center gap-3 text-nowrap text-sm font-bold">
          {!isMobile && (
            <div className="flex flex-row items-center gap-6">
              <Link
                href={'/'}
                className={`${
                  activeLink === `/${currentLocale}`
                    ? 'text-orange-500'
                    : 'text-gray-800'
                }`}
              >
                CIP
              </Link>

              <DRepMenu />
              <Link
                  href={'/proposals'}
                  className={`${
                    !!activeLink && activeLink.includes('proposals')
                      ? 'text-orange-500'
                      : 'text-gray-800'
                  }`}
                >
                  Proposals
              </Link>
              
              <VoltaireMenu />
            </div>
          )}
          <div>
            {!isConnected ? (
              <WalletConnectButton test_name={'header'} />
            ) : (
              <WalletInfoCard test_name={'header'} />
            )}
          </div>
          {!isMobile && <NotificationDrawer />}
          {isMobile && (
            <div
              className="cursor-pointer"
              onClick={() => setIsMobileDrawerOpen(true)}
            >
              <img src="/svgs/drawer-icon.svg" alt="Drawer" />
            </div>
          )}
          {isMobileDrawerOpen && (
            <SliderMenu
              isOpen={isMobileDrawerOpen}
              handleClose={() => setIsMobileDrawerOpen(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
};

export { Header };
