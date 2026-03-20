import { FC, useCallback } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { useWallet, ModalType, useModals } from '@/context/globalContext';
import { AuthMethod as ExtendedAuthMethod } from '../../../types/auth';

export interface WalletOption {
  icon: string;
  label: string;
  name: string;
  cip95Available: boolean;
  dataTestId?: string;
  authMethod?: ExtendedAuthMethod;
}

export const WalletOptionButton: FC<WalletOption> = ({ ...props }) => {
  const {
    wallet: { isConnecting, walletBeingConnected },
  } = useWallet();
  const { closeModal } = useModals();
  const { addErrorAlert } = useGlobalNotifications();
  const { connectWallet } = useWallet();
  const {
    dataTestId,
    icon,
    label,
    name,
    cip95Available,
    authMethod = ExtendedAuthMethod.HOT_WALLET,
  } = props;

  const enableByWalletName = useCallback(async () => {
    try {
      if (isConnecting) return;

      const { success, error } = await connectWallet(authMethod, name);

      if (success) {
        closeModal(ModalType.LOGIN);
        closeModal(ModalType.WALLET_LIST);
      } else {
        console.log('Error connecting to wallet:', error);
        addErrorAlert(error || 'Unknown error connecting to wallet');
      }
    } catch (error) {
      addErrorAlert(String(error?.error ? error?.error : error));
      console.log(error);
    }
  }, [isConnecting, name, authMethod]);

  return (
    <Box
      data-testid={dataTestId}
      sx={{
        alignItems: 'center',
        border: isConnecting ? 'none' : `1px solid #D6E2FF`,
        bgcolor: isConnecting ? '#EAE9F0' : 'white',
        borderRadius: '100px',
        boxShadow: isConnecting ? undefined : '0px 0px 11px 0px #24223230',
        boxSizing: 'border-box',
        cursor: cip95Available
          ? isConnecting
            ? 'default'
            : 'pointer'
          : 'unset',
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '16px',
        padding: '12px 13px 12px 13px',
        transition: 'background .2s',
        position: 'relative',
        width: '100%',
        '&:hover': isConnecting
          ? undefined
          : {
              background: '#D6E2FF',
            },
      }}
      key={name}
      onClick={enableByWalletName}
    >
      <img
        alt={`${name} icon`}
        src={icon}
        className={`h-6 w-6 ${isConnecting && 'grayscale'}`}
      />
      <Typography
        color={isConnecting ? '#C1BED3' : 'primaryBlue'}
        sx={{
          fontSize: '16px',
          fontWeight: '500',
        }}
      >
        {name ?? label}
      </Typography>
      <div className="h-6 w-6" />
      {walletBeingConnected === name && (
        <Box
          position="absolute"
          left={0}
          right={0}
          display="flex"
          justifyContent="center"
        >
          <CircularProgress size={26} />
        </Box>
      )}
    </Box>
  );
};
