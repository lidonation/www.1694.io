'use client';
import React, { useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
  Popover,
} from '@mui/material';

type FilterOption = {
  label: string;
  value: string;
};

interface ProposalFilterProps {
  showFilter: boolean;
  setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSort: (value: boolean) => void;
  selectedCategories: string[];
  setSelectedCategories: (value: string[]) => void;
  selectedCommittees: string[];
  setSelectedCommittees: (value: string[]) => void;
  setSortBy: (value: string) => void;
  setSortOrder: (value: 'asc' | 'desc') => void;
  setSearch: (value: string) => void;
}

const categoryOptions: FilterOption[] = [
  { label: 'Core', value: 'Core' },
  { label: 'Research', value: 'Research' },
  { label: 'Governance Support', value: 'Governance Support' },
  { label: 'Marketing & Innovation', value: 'Marketing & Innovation' },
  { label: 'None of these', value: 'None of these' },
];

const committeeOptions: FilterOption[] = [
  { label: 'Marketing Committee', value: 'Marketing Committee' },
  { label: 'Open Source Committee', value: 'Open Source Committee' },
  { label: 'Technical Steering Committee', value: 'Technical Steering Committee' },
  { label: 'Membership & Community Committee', value: 'Membership & Community Committee' },
  { label: 'Product Committee', value: 'Product Committee' },
  { label: 'Civics Committee', value: 'Civics Committee' },
  { label: 'Intersect Steering Committee Election', value: 'Intersect Steering Committee' },
  { label: 'Intersect Board ', value: 'Intersect Board' },
  { label: 'Growth and Marketing Committee', value: 'Growth and Marketing Committee' },
  { label: 'Cardano Budget Committee', value: 'Cardano Budget Committee' },
  { label: 'None', value: 'None' },
];

const ProposalFilter: React.FC<ProposalFilterProps> = ({
  showFilter,
  setShowFilter,
  setShowSort,
  selectedCategories,
  setSelectedCategories,
  selectedCommittees,
  setSelectedCommittees,
  setSortBy,
  setSortOrder,
  setSearch,
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  return (
    <>
      <IconButton
        ref={buttonRef}
        color="primary"
        sx={{ width: 40, height: 40 }}
        onClick={() => {
          setShowFilter((prev) => !prev);
          setShowSort(false);
        }}
        aria-label="Filter"
      >
        <img src="/svgs/filter.svg" className="mt-1 h-5 w-5" alt="Filter Sort" />
      </IconButton>

      <Popover
        open={showFilter}
        anchorEl={buttonRef.current}
        onClose={() => setShowFilter(false)}
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
            pb: 1,
            color: 'text.secondary',
          }}
        >
          Filter by Category
        </Typography>

        <Box mt={1}>
          <FormGroup>
            {categoryOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={selectedCategories.includes(option.value)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedCategories(
                        checked
                          ? [...selectedCategories, option.value]
                          : selectedCategories.filter((cat) => cat !== option.value)
                      );
                    }}
                  />
                }
                label={option.label}
              />
            ))}
          </FormGroup>
        </Box>

        <Typography
          variant="subtitle2"
          sx={{
            borderBottom: '1px solid #e0e0e0',
            pb: 1,
            mt: 2,
            color: 'text.secondary',
          }}
        >
          Filter by Committee
        </Typography>

        <Box mt={1}>
          <FormGroup>
            {committeeOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={selectedCommittees.includes(option.value)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSelectedCommittees(
                        checked
                          ? [...selectedCommittees, option.value]
                          : selectedCommittees.filter((com) => com !== option.value)
                      );
                    }}
                  />
                }
                label={option.label}
              />
            ))}
          </FormGroup>
        </Box>

        {(selectedCategories.length > 0 || selectedCommittees.length > 0) && (
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
                setSelectedCategories([]);
                setSelectedCommittees([]);
                setSortBy('updatedAt');
                setSortOrder('desc');
                setSearch('');
              }}
            >
              Reset filters
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
};

export default ProposalFilter;
