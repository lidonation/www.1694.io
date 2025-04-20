import { useWallet } from '@/context/walletContext';
import { useScreenDimension } from '@/hooks';
import { formattedAda, shortenAddress } from '@/lib';
import { Box, Typography } from '@mui/material';

export const ConnectedWalletCard = () => {
  const {
    wallet: { stakeKeyBech32, balance },
  } = useWallet();
  const { isMobile } = useScreenDimension();
  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      className="divide-x-2 divide-white text-white"
    >
      <Box alignItems="center" display="flex" className="px-1">
        {!isMobile ? (
          <Typography
            fontSize="0.75rem"
            fontWeight={300}
            marginRight="0.125rem"
            className="mr-1 text-xs tracking-wide"
          >
            Wallet:
          </Typography>
        ) : (
          <Box className="mr-1">
            <img src="/svgs/wallet.svg" alt="wallet icon" />
          </Box>
        )}
        {stakeKeyBech32 ? (
          <Typography
            fontWeight={600}
            fontSize="0.75rem"
            className="text-xs uppercase tracking-wide text-gray-300"
          >
            {shortenAddress(stakeKeyBech32, 5)}
          </Typography>
        ) : (
          <Typography
            fontWeight={600}
            fontSize="0.75rem"
            className="text-xs uppercase tracking-wide text-gray-300"
          >
            --
          </Typography>
        )}
      </Box>
      <Box alignItems="center" display="flex" className="px-1">
        {!isMobile && (
          <Typography
            fontWeight={300}
            fontSize="0.75rem"
            marginRight="0.25rem"
            className="mr-1 text-xs tracking-wide"
          >
            Voting Power:
          </Typography>
        )}
        {balance ? (
          <Typography
            fontWeight={600}
            fontSize="0.75rem"
            className="text-xs tracking-wide text-gray-300"
          >
            ₳ {formattedAda(balance, 2)}
          </Typography>
        ) : (
          <Typography
            fontWeight={600}
            fontSize="0.75rem"
            className="text-xs uppercase tracking-wide text-gray-300"
          >
            --
          </Typography>
        )}
      </Box>
    </Box>
  );
};
