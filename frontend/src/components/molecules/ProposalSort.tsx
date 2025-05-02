'use client';
import React, { useRef, useEffect } from 'react';
import SortIcon from '@mui/icons-material/SwapVert';
import {
  IconButton,
  Paper,
  Radio,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Typography,
  Box,
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
  const sortRef = useRef<HTMLDivElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSort &&
        sortRef.current &&
        !sortRef.current.contains(event.target as Node) &&
        sortButtonRef.current &&
        !sortButtonRef.current.contains(event.target as Node)
      ) {
        setShowSort(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSort]);

  return (
    <Box position="relative">
      <IconButton
        ref={sortButtonRef}
        onClick={() => {
          setShowSort((prev) => !prev);
          setShowFilter(false);
        }}
        color="primary"
        sx={{ width: 40, height: 40 }}
      >
        <img
          src="/svgs/arrows-sort.svg"
          className="mt-1 h-5 w-5"
          alt="Arrows Sort"
        />
      </IconButton>

      {showSort && (
        <Paper
          ref={sortRef}
          elevation={4}
          sx={{
            position: 'absolute',
            left: 0,
            top: '100%',
            mt: 1,
            width: 300,
            bgcolor: '#f1f3fe',
            p: 2,
            zIndex: 50,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ pb: 1, borderBottom: '1px solid #ccc' }}
          >
            Sort Proposals by:
          </Typography>

          <Box mt={2}>
            <FormControl component="fieldset">
              <RadioGroup
                value={
                  sortBy === 'alphabetical'
                    ? 'alphabetical'
                    : sortBy === 'lastModified'
                      ? 'lastModified'
                      : ''
                }
                onChange={(e) => {
                  const value = e.target.value;
                  setSortBy(value);
                  setSortOrder(value === 'alphabetical' ? 'asc' : 'desc');
                }}
              >
                <FormControlLabel
                  value="alphabetical"
                  control={<Radio />}
                  label="Alphabetical"
                />
                <FormControlLabel
                  value="lastModified"
                  control={<Radio />}
                  label="Last Modified"
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Box mt={2}>
            <Typography variant="body2" fontWeight="medium">
              Budget
            </Typography>
            <FormControl component="fieldset" sx={{ pl: 1 }}>
              <RadioGroup
                value={sortBy === 'budget' ? sortOrder : ''}
                onChange={(e) => {
                  setSortBy('budget');
                  setSortOrder(e.target.value as 'asc' | 'desc');
                }}
              >
                <FormControlLabel
                  value="desc"
                  control={<Radio />}
                  label="Highest to Lowest"
                />
                <FormControlLabel
                  value="asc"
                  control={<Radio />}
                  label="Lowest to Highest"
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Box mt={2}>
            <Typography variant="body2" fontWeight="medium">
              Conversion Rate
            </Typography>
            <FormControl component="fieldset" sx={{ pl: 1 }}>
              <RadioGroup
                value={sortBy === 'conversionRate' ? sortOrder : ''}
                onChange={(e) => {
                  setSortBy('conversionRate');
                  setSortOrder(e.target.value as 'asc' | 'desc');
                }}
              >
                <FormControlLabel
                  value="desc"
                  control={<Radio />}
                  label="Highest to Lowest"
                />
                <FormControlLabel
                  value="asc"
                  control={<Radio />}
                  label="Lowest to Highest"
                />
              </RadioGroup>
            </FormControl>
          </Box>

          {(sortBy !== 'createdAt' || sortOrder !== 'desc') && (
            <Box display="flex" justifyContent="flex-end" pt={2}>
              <Button
                variant="contained"
                onClick={() => {
                  setSortBy('createdAt');
                  setSortOrder('desc');
                }}
                sx={{
                  bgcolor: '#002e9f',
                  '&:hover': { bgcolor: '#001e70' },
                  borderRadius: '999px',
                  textTransform: 'none',
                }}
              >
                Reset sorting
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ProposalSort;
