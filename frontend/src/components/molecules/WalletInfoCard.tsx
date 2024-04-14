import { Box, Button, Typography } from "@mui/material";

import { useCardano } from "@/context/walletContext";
import './MoleculeStyles.css'
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
          width:'200px'
        }}
      >
        <Typography className="text-wall-info-txt-color text-sm font-medium">
          Connected Wallet
        </Typography>
        <Box sx={{ alignItems: "center", display: "flex" }}>
          <Typography
          className="flex-1 text-sm font-normal overflow-hidden overflow-ellipsis max-w-2.5"
          >
            {address}
          </Typography>
          <Button
            data-testid={"disconnect-button"}
            variant="text"
            onClick={onClickDisconnect}
            className="flex max-w-0.5 justify-end"
          >
            <img 
            src="/close.svg"
            alt="Close Icon"

            />
          </Button>
        </Box>
      </Box>
    )
  );
};
