import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import MarkdownParser from '../atoms/MarkdownParser';

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
      <Typography className="text-base leading-relaxed text-primary-300">
        {question}
      </Typography>
      <Box>
        {isLoading ? (
          <Skeleton height={200} sx={{ m: 0, p: 0 }} />
        ) : (
          <MarkdownParser text={answer} />
        )}
      </Box>
    </Box>
  );
};

export default BudgetDiscussionInfoSegment;
