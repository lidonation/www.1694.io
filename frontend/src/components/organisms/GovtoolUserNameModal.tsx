import React, { useState } from 'react';
import { ModalContents, ModalHeader, ModalWrapper } from '../atoms';
import { useDRepContext } from '@/context/drepContext';
import { Button, TextField, Typography } from '@mui/material';
import { postUsernameToGovTool } from '@/services/requests/postUsernameToGovTool';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import { setUpPdfJwt } from '@/lib/pdfJwtHelper';
import { loginUserToPdf } from '@/services/requests/loginUserToPdf';
import { useWallet } from '@/context/walletContext';
import { useCardano } from '@/context/cardanoContext';
import { AuthMethod } from '../../../types/auth';

function GovToolUserNameModal({
  hideCloseButton,
}: {
  hideCloseButton: boolean;
}) {
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const { setGovToolUsernameModalOpen } = useDRepContext();
  const { addSuccessAlert, addWarningAlert, addErrorAlert } =
    useGlobalNotifications();
  const { signMessage } = useCardano();
  const {
    wallet: { dRepId, dRepKeyHash, isDRep },
    activeWallet,
  } = useWallet();

  const validateUsername = (username) => {
    if (username === '') {
      setUsernameError('');
      return;
    }

    const usernamePattern = /^(?=.*[a-z])[a-z0-9._]{1,30}$/;
    const invalidStartPattern = /^[._]/;

    if (!usernamePattern.test(username) || invalidStartPattern.test(username)) {
      setUsernameError(
        'Invalid username. Only lower case letters, numbers, underscores, and periods are allowed. Username must be between 1 and 30 characters, contain at least one letter and cannot start with a period or underscore.',
      );
    } else {
      setUsernameError('');
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.trim();
    setUsername(value);
    validateUsername(value);
  };

  const handleSubmit = async () => {
    try {
      await postUsernameToGovTool({
        govtoolUsername: username,
      });

      addSuccessAlert('Your username was recorded successfully.');
      setGovToolUsernameModalOpen(false);

      if (isDRep) {
        addWarningAlert(
          'You are a DRep! We need to verify your drep key.',
          false,
        );
        await signAsDRep();
      }
    } catch (error) {
      setUsername('');
      addErrorAlert(error);
      console.error(error);
    }
  };

  const signAsDRep = async () => {
    let signedData = await signMessage(
      `To proceed, please sign this data to verify your dRep identity. This ensures that the action is secure and confirms your identity. Timestamp: ${new Date()?.getTime()}`,
      dRepId,
      activeWallet === AuthMethod.HOT_WALLET ? true : false,
      activeWallet === AuthMethod.LOGIN_FILE ? true : false,
    );
    const drepResponse = await loginUserToPdf({
      identifier: dRepKeyHash.to_hex(),
      signedData,
    });

    await setUpPdfJwt(drepResponse);
  };

  return (
    <ModalWrapper
      hideCloseButton={hideCloseButton}
      onClose={() => setGovToolUsernameModalOpen(false)}
    >
      <ModalHeader>Add your GovTool username</ModalHeader>
      <ModalContents>
        <Typography
          variant="body2"
          sx={{
            mt: 2,
            mb: 3,
          }}
        >
          By setting up a unique username, you can submit a proposal,
          participate in discussions, connect with other members and maintains a
          respectful environment. In the provided text field, please type your
          desired username.
        </Typography>

        <TextField
          label="Username"
          variant="outlined"
          sx={{
            mb: 2,
          }}
          fullWidth
          value={username || ''}
          onChange={(e) => handleUsernameChange(e)}
          required
          inputProps={{
            'data-testid': 'username-input',
          }}
          error={Boolean(usernameError)}
          helperText={usernameError}
        />
        <Button
          data-testid="proceed-button"
          variant="contained"
          fullWidth
          disabled={
            !Boolean(usernameError) &&
            username?.length > 0 &&
            username?.length <= 30
              ? false
              : true
          }
          onClick={handleSubmit}
        >
          Proceed with this username
        </Button>
      </ModalContents>
    </ModalWrapper>
  );
}

export default GovToolUserNameModal;
