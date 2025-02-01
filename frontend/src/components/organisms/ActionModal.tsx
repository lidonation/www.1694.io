import { Box, Typography } from '@mui/material';
import { ModalContents, ModalHeader, ModalWrapper } from '../atoms';
import Button from '../atoms/Button';

interface ActionButton {
  handleClick: () => void;
  className?: string;
  label: string;
}

export interface ActionModalProps {
  title: string;
  hideCloseButton?: boolean;
  severity: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  actionButtons: ActionButton[];
  handleClose: () => void;
  footer?: React.ReactNode;
}

export function ActionModal({
  title,
  severity,
  children,
  actionButtons,
  handleClose,
  footer,
  hideCloseButton,
}: ActionModalProps) {
  const renderIconsOnSeverity = () => {
    switch (severity) {
      case 'success':
        return <img src="/img/success.png" />;
      case 'error':
        return <img src="/img/warning.png" />;
      case 'warning':
        return <img src="/img/warning.png" />;
      case 'info':
        return <img src="/img/info-circle.png" />;
    }
  };
  return (
    <ModalWrapper dataTestId="action-modal" onClose={handleClose} hideCloseButton={hideCloseButton}>
      <ModalHeader
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {renderIconsOnSeverity()}
      </ModalHeader>
      <ModalContents>
        <Typography
          variant="h4"
          className="mb-6 text-center text-sm font-medium"
        >
          {title}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '31.25rem',
            overflow: 'auto',
            width: '100%',
            padding: '0.5rem',
            gap: '0.5rem',
          }}
        >
          {children}
          <Box className="flex justify-center gap-4">
            {actionButtons.map((button, index) => (
              <Button
                key={index}
                className={button.className}
                handleClick={button.handleClick}
              >
                {button.label}
              </Button>
            ))}
          </Box>
          {footer}
        </Box>
      </ModalContents>
    </ModalWrapper>
  );
}
