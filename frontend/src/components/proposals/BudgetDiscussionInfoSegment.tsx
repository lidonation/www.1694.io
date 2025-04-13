import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography className="text-lg leading-relaxed text-gray-500">
        {question}
      </Typography>
      <div>
        {isLoading ? (
          <Skeleton height={150} />
        ) : (
          <ReactMarkdown
            components={{
              p(props) {
                const { children } = props;
                return (
                  <Typography
                    variant="body1"
                    style={{
                      wordWrap: 'break-word',
                    }}
                  >
                    {children}
                  </Typography>
                );
              },
            }}
          >
            {answer?.toString() || '-'}
          </ReactMarkdown>
        )}
      </div>
    </Box>
  );
};

export default BudgetDiscussionInfoSegment;
