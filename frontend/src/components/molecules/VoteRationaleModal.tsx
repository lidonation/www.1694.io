import {
  Typography,
  CircularProgress,
  Alert,
  Box,
  TextField,
} from '@mui/material';
import { ModalContents, ModalHeader, ModalWrapper } from '../atoms';
import { useGetExternalMetadata } from '@/hooks/useGetExternalMetadata';
import { useEffect, useState } from 'react';
import Button from '../atoms/Button';
import { useGlobalNotifications } from '@/context/globalNotificationContext';
import SubmitMetadataModal from '../atoms/SubmitMetadataModal';
import { getJSONLDFromData } from '@/lib/metadataProcessor';
import { CIP_100 } from '@/lib/drepActions/jsonContext';
import { createDRepVoteContext } from '@/lib/drepActions/voteContext';
import { VoteMetadata } from '../../../types/commonTypes';

interface RationaleDataNormal {
  comment: string;
}
interface RationaleDataJsonLd {
  comment: {
    '@type': string;
    '@value': string;
  };
}

type RationaleDataVariants = RationaleDataNormal | RationaleDataJsonLd;

export interface VoteRationaleModalProps {
  mode: 'view' | 'edit';
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  rationaleUrl?: string;
  extraData?: VoteMetadata;
}

export function VoteRationaleModal({
  mode,
  open = false,
  onClose,
  onEdit,
  rationaleUrl,
  extraData,
}: VoteRationaleModalProps) {
  const [rationaleData, setRationaleData] =
    useState<RationaleDataVariants | null>(null);
  const [jsonld, setJsonld] = useState<any>(null);
  const [jsonHash, setJsonHash] = useState(null);
  const [rationaleInput, setRationaleInput] = useState('');
  const { addSuccessAlert } = useGlobalNotifications();
  const [isSubmittingMetadata, setIsSubmittingMetadata] = useState(false);
  const [isMetadataReadyForSubmission, setIsMetadataReadyForSubmission] =
    useState(false);
  const { metadata, isMetadataLoading, metadataError } = useGetExternalMetadata(
    rationaleUrl,
    mode === 'view' && open,
  );

  useEffect(() => {
    if (metadata) {
      setRationaleData(metadata.body);
    }
  }, [metadata]);

  const handleSuccessfulSubmit = (resultHash?: string) => {
    setIsSubmittingMetadata(false);
    setIsMetadataReadyForSubmission(false);
    addSuccessAlert(
      'Vote resubmitted with new rationale. The changes may take some time to propagate.',
    );
    onEdit && onEdit();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setIsSubmittingMetadata(true);
      //prepare jsonld and hash
      const { jsonHash, jsonld } = await getJSONLDFromData({
        body: { comment: rationaleInput },
        context: createDRepVoteContext(['comment']),
        cip: CIP_100,
        vkeys: null,
      });
      setJsonld(jsonld);
      setJsonHash(jsonHash);
      setIsMetadataReadyForSubmission(true);
    } catch (error) {
      setIsSubmittingMetadata(false);
      setIsMetadataReadyForSubmission(false);
    }
  };

  const renderContent = () => {
    if (mode === 'edit') {
      return (
        <Box
          display="flex"
          flexDirection="column"
          gap={3}
          minHeight={200}
          sx={{ width: '100%' }}
        >
          <TextField
            multiline
            rows={4}
            placeholder="Enter your rationale here..."
            value={rationaleInput}
            onChange={(e) => setRationaleInput(e.target.value)}
            fullWidth
          />
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: '0.75rem',
              fontStyle: 'italic',
              mt: 1,
            }}
          >
            Note: Confirming means resubmitting your vote(same choice) with this rationale
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              bgcolor="transparent"
              handleClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              handleClick={handleSubmit}
              disabled={!rationaleInput || isSubmittingMetadata}
            >
              Confirm
            </Button>
          </Box>
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
          {rationaleData && typeof rationaleData.comment === 'string'
            ? rationaleData.comment
            : rationaleData.comment['@value'] || 'No rationale provided'}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem',
            fontStyle: 'italic',
            mt: 1,
          }}
        >
          Note: These comments represent the author's views and may contain bias
        </Typography>
      </Box>
    );
  };

  if (!open) {
    return null;
  }

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
        {mode === 'edit'
          ? 'Add a rationale/context to your vote'
          : 'Vote Rationale'}
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
        {isMetadataReadyForSubmission && (
          <SubmitMetadataModal
            onClose={() => {
              setIsMetadataReadyForSubmission(false);
              setIsSubmittingMetadata(false);
              setJsonld(null);
              setJsonHash(null);
              onClose();
            }}
            onSuccessfulSubmit={handleSuccessfulSubmit}
            metadataType="voteUpdate"
            data={{
              jsonld,
              jsonHash,
            }}
            extraData={{
              voteUpdate: extraData,
            }}
          />
        )}
      </ModalContents>
    </ModalWrapper>
  );
}
