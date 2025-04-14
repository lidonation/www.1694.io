import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

type MarkdownParserProps = {
  text: string;
};

const MarkdownParser = ({ text }: MarkdownParserProps) => {
  if (!text) {
    return null;
  }

  return (
    <ReactMarkdown
      components={{
        p({ children }) {
          return <Typography component="div">{children}</Typography>;
        },
        li({ children }) {
          return (
            <li>
              <Typography component="span">{children}</Typography>
            </li>
          );
        },
        ol({ children }) {
          return (
            <Box component="ol" sx={{ pl: 4, listStyle: 'decimal' }}>
              {children}
            </Box>
          );
        },
        ul({ children }) {
          return (
            <Box component="ul" sx={{ pl: 4, listStyle: 'disc' }}>
              {children}
            </Box>
          );
        },
      }}
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {text?.toString()}
    </ReactMarkdown>
  );
};

export default MarkdownParser;
