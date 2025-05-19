import React from 'react';
import { Box, Typography } from '@mui/material';
import { usePdfTokenManager } from '@/hooks/usePdfTokenManager';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { ActionButton, ActionModal } from '../organisms/ActionModal';
import { ExternalOAuthMetadata, OAuthProviderType } from '@/models/oauth';

interface SaveJwtModalProps {
  hideCloseButton?: boolean;
  onClose: () => void;
  jwt: string;
  stakeKeyBech32: string;
  metadata?: ExternalOAuthMetadata[OAuthProviderType.GOVTOOLS];
  expiresAt?: Date;
}

const SaveJwtModal: React.FC<SaveJwtModalProps> = ({
  hideCloseButton = false,
  onClose,
  jwt,
  stakeKeyBech32,
  expiresAt,
  metadata,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const { storeJwtInOAuth } = usePdfTokenManager();
  const { addSuccessAlert, addErrorAlert } = useGlobalNotifications();

  const handleSaveJwt = async () => {
    setIsProcessing(true);
    try {
      const success = await storeJwtInOAuth(jwt, stakeKeyBech32, expiresAt, metadata);
      if (success) {
        addSuccessAlert(
          "Gov.tools token saved successfully. You won't need to sign with your keys again.",
        );
      }
      onClose();
    } catch (error) {
      addErrorAlert('Failed to save token:', error);
      setIsProcessing(false);
    }
  };

  const actionButtons: ActionButton[] = [
    {
      label: isProcessing ? 'Saving...' : 'Yes, Save Token',
      className:
        'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 ',
      handleClick: handleSaveJwt,
      disabled: isProcessing,
      loading: isProcessing,
    },
    {
      label: "No, Don't Save",
      className: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
      handleClick: onClose,
      disabled: isProcessing,
      loading: false,
    },
  ];

  return (
    <ActionModal
      title="Save Gov.tools Authentication"
      severity="info"
      handleClose={onClose}
      hideCloseButton={hideCloseButton}
      actionButtons={actionButtons}
      children={
        <Box sx={{ mb: 1 }}>
          <Typography variant="body1" className="text-gray-700">
            By saving your token, you can interact with gov.tools without
            needing to sign with your keys each time.
          </Typography>
        </Box>
      }
    />
  );
};

export default SaveJwtModal;
