import { Box, Button, Typography } from "@mui/material";

import { useCardano } from "@/context/walletContext";

export const WalletInfoCard = () => {
  const { address, disconnectWallet } = useCardano();
  const onClickDisconnect = async () => {
    await disconnectWallet();
  };

  return (
    address && (
      <Box
      data-testId='wallet-info-card'
        sx={{
          border: 1,
          borderColor: "lightBlue",
          borderRadius: 3,
          px: 1.75,
          py: 1.5,
          position: "relative",
        }}
      >
        <Typography sx={{ color: "#ADAEAD", fontSize: 12, fontWeight: 500 }}>
          Connected Wallet
        </Typography>
        <Box sx={{ alignItems: "center", display: "flex" }}>
          <Typography
            sx={{
              flex: 1,
              fontSize: 14,
              fontWeight: 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: 10,
            }}
          >
            {address}
          </Typography>
          <Button
            data-testid={"disconnect-button"}
            variant="text"
            onClick={onClickDisconnect}
          >
            Disconnect
          </Button>
        </Box>
      </Box>
    )
  );
};
