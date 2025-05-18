import { Box, CircularProgress, Typography } from '@mui/material';
import { ModalContents, ModalHeader, ModalWrapper } from '../atoms';
import Button from '../atoms/Button';

export interface ActionButton {
  handleClick: () => void;
  className?: string;
  label: string;
  disabled?: boolean;
  loading?: boolean;
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
    let iconSrc = '/img/info-circle.png';
    switch (severity) {
      case 'success':
        iconSrc = '/svgs/success.svg';
        break;
      case 'error':
        iconSrc = '/svgs/alert-circle.svg';
        break;
      case 'warning':
        iconSrc = '/img/warning.png';
        break;
      case 'info':
        iconSrc = '/img/info-circle.png';
        break;
      default:
        iconSrc = '/img/info-circle.png';
        break;
    }
    return <img src={iconSrc} alt="Severity Icon" className="h-16 w-16" />;
  };
  return (
    <ModalWrapper
      dataTestId="action-modal"
      onClose={handleClose}
      hideCloseButton={hideCloseButton}
    >
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
                disabled={button?.disabled}
              >
                {button?.loading ? (
                  <CircularProgress size={20} />
                ) : (
                  button.label
                )}
              </Button>
            ))}
          </Box>
          {footer}
        </Box>
      </ModalContents>
    </ModalWrapper>
  );
}
