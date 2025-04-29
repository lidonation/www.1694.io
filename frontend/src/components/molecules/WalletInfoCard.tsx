import { Box, Grow } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { ConnectedWalletCard } from '../atoms/ConnectedWalletCard';
import { DelegatedTo } from './DelegatedTo';
import Button from '../atoms/Button';
import { useWallet } from '@/context/globalContext';

type WalletInfoCardProps = {
  test_name: string;
};

export const WalletInfoCard = ({ test_name }: WalletInfoCardProps) => {
  const {
    wallet: { isConnected, stakeKeyBech32 },
    disconnectWallet,
  } = useWallet();
  const [showDetails, setShowDetails] = useState(false);

  const dropDownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropDownRef.current &&
        !dropDownRef.current.contains(event.target as Node)
      ) {
        setShowDetails(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDetails]);

  function logUserOut() {
    setShowDetails(false);
    setTimeout(() => {
      disconnectWallet();
    }, 400);
  }

  return (
    <Grow
      in={isConnected}
      style={{ transformOrigin: 'top center' }}
      {...(!!stakeKeyBech32 ? { timeout: 0 } : { timeout: 300 })}
    >
      <Box
        ref={dropDownRef}
        data-testid={`${test_name}-wallet-info-card`}
        className="relative cursor-pointer rounded-3xl bg-gray-800"
      >
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          className="p-1.5"
          onClick={() => {
            setShowDetails(!showDetails);
          }}
        >
          <ConnectedWalletCard />

          <div className="w-fit">
            <Box className="rounded-3xl bg-primary-300 px-2">
              {' '}
              {showDetails ? (
                <img
                  src="/svgs/chevron-up.svg"
                  alt="Toggle to close wallet details"
                  className="h-6 w-6"
                />
              ) : (
                <img
                  src="/svgs/chevron-down.svg"
                  alt="Toggle to open wallet details"
                  className="h-6 w-6"
                />
              )}
            </Box>
          </div>
          {/* )} */}
        </Box>
        <Grow
          in={showDetails}
          style={{ transformOrigin: 'top center' }}
          {...(showDetails ? { timeout: 300 } : {})}
        >
          <Box className="absolute left-0 right-0 z-50">
            <DelegatedTo className="mt-1 rounded-t-3xl" />
            <Box className="flex w-full justify-end rounded-b-3xl bg-extra_gray p-1.5 shadow">
              <Button
                size="small"
                sx={{
                  backgroundColor: '#1f2937',
                }}
                handleClick={logUserOut}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Grow>
      </Box>
    </Grow>
  );
};
