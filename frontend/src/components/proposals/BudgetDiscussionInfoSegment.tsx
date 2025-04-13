import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

type BudgetDiscussionInfoSegmentProps = {
  question: string;
  answer: string;
  show?: boolean;
  isLoading?: boolean;
};
const BudgetDiscussionInfoSegment = ({
  question,
  answer,
  show = true,
  isLoading = false,
}: BudgetDiscussionInfoSegmentProps) => {
  if (!show) {
    return null;
  }

  return (
    <Box>
      <Typography className="text-lg leading-relaxed text-gray-500">
        {question}
      </Typography>
      <div>
        {isLoading ? (
          <Skeleton height={200} sx={{ m: 0, p: 0 }} />
        ) : (
          <ReactMarkdown
            components={{
              p({ children }) {
                return (
                  <Typography sx={{ marginBottom: '0.5em' }}>
                    {children}
                  </Typography>
                );
              },
              li({ children }) {
                return (
                  <li>
                    <Typography>{children}</Typography>
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
            {answer?.toString()}
          </ReactMarkdown>
        )}
      </div>
    </Box>
  );
};

export default BudgetDiscussionInfoSegment;
