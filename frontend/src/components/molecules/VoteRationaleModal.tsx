import { Typography, CircularProgress, Alert, Box } from '@mui/material';
import { ModalContents, ModalHeader, ModalWrapper } from '../atoms';
import { useGetExternalMetadata } from '@/hooks/useGetExternalMetadata';

interface RationaleData {
  body: {
    comment: string;
  };
}

export interface VoteRationaleModalProps {
  mode: 'view' | 'edit';
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  rationaleUrl?: string;
}

export function VoteRationaleModal({
  mode,
  open = false,
  onClose,
  onEdit,
  rationaleUrl,
}: VoteRationaleModalProps) {
  if (!open) {
    return null;
  }

  const { metadata, isMetadataLoading, metadataError } =
    useGetExternalMetadata(rationaleUrl);

  const renderContent = () => {
    if (mode === 'edit') {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={200}
        >
          <Typography variant="h6" color="text.secondary">
            Ability to add rationale coming soon
          </Typography>
        </Box>
      );
    }

    if (isMetadataLoading) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={200}
        >
          <CircularProgress color="primary" />
        </Box>
      );
    }

    if (metadataError) {
      return (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {metadataError ||
            'Failed to load rationale data. Please try again later.'}
        </Alert>
      );
    }

    if (!metadata) {
      return (
        <Alert severity="info" sx={{ width: '100%', mb: 2 }}>
          No rationale data available.
        </Alert>
      );
    }

    return (
      <Box display="flex" flexDirection="column">
        <Typography
          variant="body1"
          sx={{
            mb: 3,
            color: 'text.primary',
            lineHeight: 1.6,
            fontWeight: 'normal',
          }}
        >
          {metadata?.body?.comment || 'No comment provided'}
        </Typography>
      </Box>
    );
  };

  return (
    <ModalWrapper dataTestId="action-modal" onClose={onClose}>
      <ModalHeader
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          color: 'text.primary',
          fontSize: '1.25rem',
          fontWeight: 500,
        }}
      >
        Vote Rationale
      </ModalHeader>
      <ModalContents>
        {renderContent()}
        {mode === 'view' && rationaleUrl && (
          <Typography
            variant="caption"
            sx={{
              textAlign: 'center',
              color: 'text.secondary',
              mt: 2,
            }}
          >
            <a
              href={rationaleUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
            >
              View full rationale
            </a>
          </Typography>
        )}
      </ModalContents>
    </ModalWrapper>
  );
}
