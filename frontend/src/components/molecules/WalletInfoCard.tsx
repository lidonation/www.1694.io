import { Box, Typography } from '@mui/material';

import { useCardano } from '@/context/walletContext';
import './MoleculeStyles.css';
import { useDRepContext } from '@/context/drepContext';
import { formatWalletAddress, lovelaceToAda, shortNumber } from '@/lib';
import Button from '../atoms/Button';
import { useScreenDimension } from '@/hooks';

export const WalletInfoCard = () => {
  const { address, walletState } = useCardano();
  const { setLoginModalOpen, isLoggedIn } = useDRepContext();
  const { isMobile } = useScreenDimension();

  //Convert lovelace to ada and format the number
  function formattedAda(lovelace: number) {
    let ada = lovelaceToAda(lovelace);
    return shortNumber(ada, 2);
  }

  return (
    address &&
    walletState.balance && (
      <Box
        data-testid="wallet-info-card"
        display="flex"
        flexDirection="row"
        alignItems="center"
        bgcolor="black"
        justifyContent="space-around"
        height={32}
        className="rounded-3xl p-0.5 text-white"
      >
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          className="divide-x-2 divide-white"
        >
          <Box alignItems="center" display="flex" className="px-1">
            {!isMobile ? (
              <Typography
                fontWeight={300}
                className="mr-1 text-sm tracking-wide"
              >
                Wallet:
              </Typography>
            ) : (
              <div className="mr-1">
                <img src="/wallet.svg" alt="wallet icon" />
              </div>
            )}
            <Typography fontWeight={600} className="text-sm">
              {formatWalletAddress(address)}
            </Typography>
          </Box>
          <Box alignItems="center" display="flex" className="px-1">
            {!isMobile && (
              <Typography
                fontWeight={300}
                className="mr-1 text-sm tracking-wide"
              >
                Voting Power:
              </Typography>
            )}
            <Typography fontWeight={600} className="text-sm">
              ₳ {formattedAda(walletState.balance)}
            </Typography>
          </Box>
        </Box>
        {!isLoggedIn && (
          <Button
            size="extraSmall"
            sx={{
              width: 3
            }}
            handleClick={() => setLoginModalOpen(true)}
          >
            <Typography className="text-sm font-bold capitalize tracking-wide">
              Login
            </Typography>
          </Button>
        )}
      </Box>
    )
  );
};
