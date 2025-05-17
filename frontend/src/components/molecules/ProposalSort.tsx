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
  Popover,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import DotIndicator from '@/components/atoms/DotIndicator';

interface ProposalSortProps {
  showSort: boolean;
  setShowSort: React.Dispatch<React.SetStateAction<boolean>>;
}

type SortOption = {
  value: string;
  label: string;
  defaultOrder?: 'asc' | 'desc';
};

const sortOptions: SortOption[] = [
  { value: 'alphabetical', label: 'Alphabetical', defaultOrder: 'asc' },
  { value: 'lastModified', label: 'Last Modified', defaultOrder: 'desc' },
];

const orderableSorts: SortOption[] = [
  { value: 'budget', label: 'Budget' },
  { value: 'conversationRate', label: 'Conversation Rate' },
];

const DEFAULT_ORDER: 'asc' | 'desc' = 'desc';

const ProposalSort: React.FC<ProposalSortProps> = ({
  showSort,
  setShowSort,
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const sortBy = searchParams.get('sort') || 'updatedAt';
  const sortOrder = (searchParams.get('order') as 'asc' | 'desc') || DEFAULT_ORDER;

  const hasActiveSort = sortBy !== 'updatedAt' || sortOrder !== DEFAULT_ORDER;

  const updateSortParams = (sort: string, order: 'asc' | 'desc') => {
    params.set('sort', sort);
    params.set('order', order);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const option = sortOptions.find((opt) => opt.value === value);
    updateSortParams(value, option?.defaultOrder || 'desc');
  };

  const handleSortOrderChange = (sort: string, order: 'asc' | 'desc') => {
    updateSortParams(sort, order);
  };

  const handleResetSort = () => {
    params.delete('sort');
    params.delete('order');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <IconButton
        ref={buttonRef}
        color="primary"
        sx={{ width: 40, height: 40 }}
        onClick={() => setShowSort((prev) => !prev)}
        aria-label="Sort"
      >
        <img src="/svgs/arrows-sort.svg" className="mt-1 h-5 w-5" alt="Sort" />
        {hasActiveSort && <DotIndicator />}
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
            pb: 1,
          }}
        >
          Sort Proposals by
        </Typography>

        <Box>
          <FormControl fullWidth>
            <RadioGroup
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}>

              {sortOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        {orderableSorts.map((sort) => (
          <Box key={sort.value}>
            <Typography
              variant="subtitle2"
              sx={{
                borderTop: '1px solid #e0e0e0',
                color: 'text.secondary',
                pt: 1,
              }}
            >
              {sort.label}
            </Typography>
            <FormControl fullWidth>
              <RadioGroup
                value={sortBy === sort.value ? sortOrder : ''}
                onChange={(e) => handleSortOrderChange(sort.value, e.target.value as 'asc' | 'desc')}
              >
                <FormControlLabel value="desc" control={<Radio />} label="Highest to Lowest" />
                <FormControlLabel value="asc" control={<Radio />} label="Lowest to Highest" />
              </RadioGroup>
            </FormControl>
          </Box>
        ))}

        {hasActiveSort && (
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
              onClick={handleResetSort}
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