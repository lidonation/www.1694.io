'use client';
import React, { useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Radio,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Divider,
  Popover,
} from '@mui/material';

interface ProposalSortProps {
  showSort: boolean;
  setShowSort: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFilter: (value: boolean) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
}

const ProposalSort: React.FC<ProposalSortProps> = ({
  showSort,
  setShowSort,
  setShowFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <IconButton
        ref={buttonRef}
        color="primary"
        sx={{ width: 40, height: 40 }}
        onClick={() => {
          setShowSort((prev) => !prev);
          setShowFilter(false);
        }}
        aria-label="Sort"
      >
        <img src="/svgs/arrows-sort.svg" className="mt-1 h-5 w-5" alt="Sort" />
      </IconButton>

      <Popover
        open={showSort}
        anchorEl={buttonRef.current}
        onClose={() => setShowSort(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            width: { xs: '90vw', sm: 300 },
            bgcolor: '#f1f3fe',
            borderRadius: 2,
            boxShadow: 4,
            p: { xs: 2, sm: 2 },
          },
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            borderBottom: '1px solid #e0e0e0',
            color: 'text.secondary',
          }}
        >
          Sort Proposals by
        </Typography>

        <Box>
          <FormControl fullWidth>
            <RadioGroup
              value={sortBy}
              onChange={(e) => {
                const value = e.target.value;
                setSortBy(value);
                setSortOrder(value === 'alphabetical' ? 'asc' : 'desc');
              }}
            >
              <FormControlLabel value="alphabetical" control={<Radio />} label="Alphabetical" />
              <FormControlLabel value="lastModified" control={<Radio />} label="Last Modified" />
            </RadioGroup>
          </FormControl>
        </Box>

        <Typography
          variant="subtitle2"
          sx={{
            borderTop: '1px solid #e0e0e0',
            color: 'text.secondary',
          }}
        >
          Budget
        </Typography>

        <Box >
          <FormControl fullWidth>
            <RadioGroup
              value={sortBy === 'budget' ? sortOrder : ''}
              onChange={(e) => {
                setSortBy('budget');
                setSortOrder(e.target.value as 'asc' | 'desc');
              }}
            >
              <FormControlLabel value="desc" control={<Radio />} label="Highest to Lowest" />
              <FormControlLabel value="asc" control={<Radio />} label="Lowest to Highest" />
            </RadioGroup>
          </FormControl>
        </Box>

        <Typography
          variant="subtitle2"
          sx={{
            borderTop: '1px solid #e0e0e0',
            color: 'text.secondary',
          }}
        >
          Conversation Rate
        </Typography>

        <Box>
          <FormControl fullWidth>
            <RadioGroup
              value={sortBy === 'conversationRate' ? sortOrder : ''}
              onChange={(e) => {
                setSortBy('conversationRate');
                setSortOrder(e.target.value as 'asc' | 'desc');
              }}
            >
              <FormControlLabel value="desc" control={<Radio />} label="Highest to Lowest" />
              <FormControlLabel value="asc" control={<Radio />} label="Lowest to Highest" />
            </RadioGroup>
          </FormControl>
        </Box>

        {(sortBy !== 'updatedAt' || sortOrder !== 'desc') && (
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button
              variant="contained"
              size="small"
              sx={{
                borderRadius: '9999px',
                backgroundColor: '#1f2937',
                textTransform: 'none',
                '&:hover': { backgroundColor: '#1f2937' },
              }}
              onClick={() => {
                setSortBy('updatedAt');
                setSortOrder('desc');
              }}
            >
              Reset sorting
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default ProposalSort;