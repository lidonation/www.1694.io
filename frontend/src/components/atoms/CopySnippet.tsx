import { handleCopyText } from '@/lib';
import { styled } from '@mui/material/styles';
import { IconButton, Paper, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Check, ContentCopy } from '@mui/icons-material';

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
  const [hasCopied, setHasCopied] = useState(false);
  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => {
        setHasCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);
  
  const handleCopyHelperSnippet = () => {
    if (!snippetToCopy) {
      return;
    }
    handleCopyText(snippetToCopy);
    setHasCopied(true);
  };

  const CodeSnippet = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.grey[900],
    color: theme.palette.common.white,
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    position: 'relative',
    overflow: 'auto',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  }));

  const renderSnippetContent = ({ snippet }) => {
    if (!snippet) {
      return null;
    }
    return (
      <CodeSnippet>
        {snippetToCopy}
        <IconButton
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'transparent',
            color: hasCopied ? 'success.main' : 'white',
          }}
          onClick={handleCopyHelperSnippet}
        >
          {hasCopied ? <Check fontSize='small'/> : <ContentCopy fontSize="small" />}
        </IconButton>
      </CodeSnippet>
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
