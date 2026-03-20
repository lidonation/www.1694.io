import { Box, Typography, FormControlLabel, Switch } from '@mui/material';
import { useMemo, useState } from 'react';
import { ModalContents, ModalHeader, ModalWrapper } from '../atoms';
import type { WalletOption } from '../molecules';
import { WalletOptionButton } from '../molecules';
import { AuthMethod as ExtendedAuthMethod } from '../../../types/auth';

interface ChooseWalletModalProps {
  hideCloseButton: boolean;
  onClose?: () => void;
  open?: boolean;
}

export function ChooseWalletModal({
  hideCloseButton,
  onClose,
  open,
}: ChooseWalletModalProps) {
  const [useMesh, setUseMesh] = useState(false);

  if (!open) return null;

  const walletOptions: WalletOption[] = useMemo(() => {
    if (!window.cardano) return [];
    const keys = Object.keys(window.cardano);
    const resultWallets: WalletOption[] = [];
    keys.forEach((k: string) => {
      const cardanoWallet = window.cardano[k];
      if (cardanoWallet) {
        const { icon, name, supportedExtensions } = cardanoWallet;
        if (icon && name) {
          // Check if the name already exists in resultWallets
          const isNameDuplicate = resultWallets.some(
            (wallet) => wallet.label === name,
          );
          // Check if the supportedExtensions array contains an entry with cip === 95
          const isCip95Available = Boolean(
            supportedExtensions?.find((i) => i.cip === 95),
          );
          // If the name is not a duplicate and cip === 95 is available, add it to resultWallets
          if (!isNameDuplicate && isCip95Available) {
            resultWallets.push({
              icon,
              label: name,
              name: k,
              cip95Available: true,
            });
          }
        }
      }
    });
    return resultWallets;
  }, [window]);

  return (
    <ModalWrapper
      dataTestId="connect-your-wallet-modal"
      hideCloseButton={hideCloseButton}
      onClose={onClose}
    >
      <ModalHeader>Connect Your Wallet</ModalHeader>
      <ModalContents>
        <Typography
          sx={{
            fontSize: '16px',
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          Choose Wallet
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useMesh}
                onChange={(e) => setUseMesh(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography sx={{ fontSize: '14px', fontWeight: '500' }}>
                Use Mesh SDK (Experimental)
              </Typography>
            }
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '31.25rem',
            overflow: 'auto',
            width: '100%',
            padding: '0.5rem',
          }}
        >
          {!walletOptions.length ? (
            <Typography
              color="primary"
              variant="body2"
              className="text-center font-semibold text-blue-800"
              data-testid="no-wallets-message"
            >
              No wallets to Connect
            </Typography>
          ) : (
            walletOptions.map(({ icon, label, name, cip95Available }) => {
              return (
                <WalletOptionButton
                  dataTestId={name + '-wallet-button'}
                  key={name}
                  icon={icon}
                  label={label}
                  name={name}
                  cip95Available={cip95Available}
                  authMethod={
                    useMesh
                      ? ExtendedAuthMethod.MESH_HOT_WALLET
                      : ExtendedAuthMethod.HOT_WALLET
                  }
                />
              );
            })
          )}
        </Box>
      </ModalContents>
    </ModalWrapper>
  );
}
