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
        <Typography className="text-[#ADAEAD] text-[12px] font-[500]">
          Connected Wallet
        </Typography>
        <Box sx={{ alignItems: "center", display: "flex" }}>
          <Typography
          className="flex-1 text-[14px] font-[400] overflow-hidden overflow-ellipsis w-[10px]"
           
          >
            {address}
          </Typography>
          <Button
            data-testid={"disconnect-button"}
            variant="text"
            onClick={onClickDisconnect}
            className="flex w-[1px] justify-end"
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
