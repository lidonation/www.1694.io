import { Box, Typography, Button, Grow } from '@mui/material';
import { useCardano } from '@/context/walletContext';
import './MoleculeStyles.css';
import { useDRepContext } from '@/context/drepContext';
import DelegatedTo from './DelegatedTo';
import { useState } from 'react';
import { ConnectedWalletCard } from '../atoms/ConnectedWalletCard';

export const WalletInfoCard = () => {
  const { isEnabled, disconnectWallet } = useCardano();
  const { setLoginModalOpen, isLoggedIn, logout } = useDRepContext();
  const [showDetails, setShowDetails] = useState(false);

  async function logUserOut() {
    setShowDetails(false);
    setTimeout(() => {
      logout();
      disconnectWallet();
    }, 400);
  }

  return (
    <Grow
      in={isEnabled}
      style={{ transformOrigin: 'top center' }}
      {...(isEnabled ? { timeout: 300 } : {})}
    >
      <Box
        data-testid="wallet-info-card"
        className={`relative rounded-3xl bg-gray-800 ${!!isLoggedIn ? 'cursor-pointer' : ''}`}
      >
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          className="p-1.5"
          onClick={() => {
            isLoggedIn && setShowDetails(!showDetails);
          }}
        >
          <ConnectedWalletCard />
          {!isLoggedIn ? (
            <Button
              size="small"
              className="rounded-3xl bg-blue-800 px-1 py-0 font-bold capitalize text-white hover:bg-blue-900"
              onClick={() => setLoginModalOpen(true)}
            >
              Login
            </Button>
          ) : (
            <Typography className="rounded-3xl bg-blue-800 px-1 py-0 hover:bg-blue-900">
              {' '}
              {showDetails ? (
                <img
                  src="/chevron-up.svg"
                  alt="wallet icon"
                  className="h-5 w-6"
                />
              ) : (
                <img
                  src="/chevron-down.svg"
                  alt="wallet icon"
                  className="h-5 w-6"
                />
              )}
            </Typography>
          )}
        </Box>
        <Grow
          in={showDetails}
          style={{ transformOrigin: 'top center' }}
          {...(showDetails ? { timeout: 300 } : {})}
        >
          <Box className="absolute left-0 right-0 z-50">
            <DelegatedTo className="mt-1 rounded-t-3xl" />
            <Box className="flex w-full justify-end rounded-b-3xl bg-white p-1.5">
              <Button
                size="small"
                variant="outlined"
                onClick={logUserOut}
                className="rounded-3xl bg-gray-800 capitalize text-white hover:bg-blue-800"
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
