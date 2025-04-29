import { Box, Typography } from '@mui/material';
import { ModalContents, ModalHeader, ModalWrapper } from '../atoms';
import Link from 'next/link';
import { urls } from '@/constants';
import Button from '../atoms/Button';
interface NotDRepErrorModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  onClose?: () => void;
}
export function NotDRepErrorModal({
  onConfirm = () => {},
  onCancel = () => {},
  onClose = () => {},
}: NotDRepErrorModalProps) {


  return (
    <ModalWrapper
      dataTestId="not-drep-error-modal"
      onClose={onClose}
    >
      <ModalHeader
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <img src="/img/warning.png" />
      </ModalHeader>
      <ModalContents>
        <Typography
          variant="h4"
          className="mb-6 text-center text-sm font-medium"
        >
          Oops
        </Typography>
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
          <Typography
            color="black"
            variant="subtitle1"
            className="text-center font-semibold text-black"
            data-testid="not-a-drep-message"
          >
            You seem to not have yet registered as a DRep as your DRep ID is
            required to proceed. <br />
            <span className='text-sm font-bold'>
              You may still proceed with the registration process but keep in
              mind that you will be required to identify yourself as a DRep.
            </span>
          </Typography>
          <Box>
            <Box className="flex justify-center gap-4">
              <Button
                handleClick={onConfirm}
                className="rounded-md bg-blue-300 px-6 py-2 text-sm font-semibold text-white"
                data-testid="confirm-button"
              >
                Proceed
              </Button>
              <Button
                handleClick={onCancel}
                className="ml-4 rounded-md bg-gray-300 px-6 py-2 text-sm font-semibold text-black"
                data-testid="cancel-button"
              >
                Cancel
              </Button>
            </Box>
          </Box>
          <Typography
            color="dimgray"
            variant="subtitle2"
            className="text-center font-semibold text-black"
            data-testid="not-a-drep-message"
          >
            Wanna be a DRep? Checkout{' '}
            <Link href={urls.govToolUrl} className="text-blue-300">
              here{' '}
            </Link>
          </Typography>
        </Box>
      </ModalContents>
    </ModalWrapper>
  );
}
