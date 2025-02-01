import { handleCopyText } from '@/lib';
import { Box, IconButton, Typography } from '@mui/material';
import React from 'react';

interface CopySnippetProps {
  snippetToCopy?: string;
  isError?: boolean;
  extraText?: string;
}

const CopySnippet = ({
  snippetToCopy,
  extraText,
  isError,
}: CopySnippetProps) => {
  const handleCopyHelperSnippet = () => {
    const normalizedSnippet = snippetToCopy.replace(/\n/g, ' ');
    handleCopyText(normalizedSnippet);
  };

  const renderSnippetContent = ({ snippet }) => {
    if (!snippet) {
      return null;
    }
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          p: 2,
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          position: 'relative',
          border: '1px solid rgba(0, 0, 0, 0.12)',
        }}
      >
        <pre className="m-0x text-xs leading-none">{snippet?.trim()}</pre>
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'transparent',
          }}
          onClick={handleCopyHelperSnippet}
        >
          <img src="/svgs/copy.svg" alt="copy" />
        </IconButton>
      </Box>
    );
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {isError && <img src="/svgs/alert-circle.svg" alt="error" />}
        <Typography variant="body2">{extraText}</Typography>
      </div>
      {renderSnippetContent({ snippet: snippetToCopy })}
    </>
  );
};

export default CopySnippet;
