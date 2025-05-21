'use client';
import React, { useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import DotIndicator from '@/components/atoms/DotIndicator';
import { PROPOSAL_FILTERS_LS_KEY } from '@/lib/localStorage';

type FilterOption = {
  label: string;
  value: string;
};

interface ProposalFilterProps {
  showFilter: boolean;
  setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
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
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
  const committees = searchParams.get('committees')?.split(',').filter(Boolean) || [];
  
  const hasActiveFilters = categories.length > 0 || committees.length > 0;

  const saveToLocalStorage = (categories: string[], committees: string[]) => {
    localStorage.setItem(
      PROPOSAL_FILTERS_LS_KEY,
      JSON.stringify({ categories, committees })
    );
  };

  const updateFilterParams = (key: string, values: string[]) => {
    if (values.length > 0) {
      params.set(key, values.join(','));
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
    saveToLocalStorage(key === 'categories' ? values : categories, key === 'committees' ? values : committees);
  };

  const handleCategoryChange = (value: string, checked: boolean) => {
    const newCategories = checked
      ? [...categories, value]
      : categories.filter((category) => category !== value);
    updateFilterParams('categories', newCategories);
  };

  const handleCommitteeChange = (value: string, checked: boolean) => {
    const newCommittees = checked
      ? [...committees, value]
      : committees.filter((committee) => committee !== value);
    updateFilterParams('committees', newCommittees);
  };

  const handleResetFilters = () => {
    params.delete('categories');
    params.delete('committees');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
    localStorage.removeItem(PROPOSAL_FILTERS_LS_KEY);
  };

  useEffect(() => {
    const stored = localStorage.getItem(PROPOSAL_FILTERS_LS_KEY);
    if (!stored) return;
  
    const { categories = [], committees = [] } = JSON.parse(stored);
  
    const shouldApplyCategories = !searchParams.has('categories') && categories.length;
    const shouldApplyCommittees = !searchParams.has('committees') && committees.length;
  
    if (shouldApplyCategories || shouldApplyCommittees) {
      if (shouldApplyCategories) params.set('categories', categories.join(','));
      if (shouldApplyCommittees) params.set('committees', committees.join(','));
      params.set('page', '1');
      router.push(`?${params.toString()}`);
    }
  }, []);
  
  return (
    <>
      <IconButton
        ref={buttonRef}
        color="primary"
        sx={{ width: 40, height: 40 }}
        onClick={() => setShowFilter((prev) => !prev)}
        aria-label="Filter"
      >
        <img src="/svgs/filter.svg" className="mt-1 h-5 w-5" alt="Filter" />
        {hasActiveFilters && <DotIndicator />}
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
                    checked={categories.includes(option.value)}
                    onChange={(e) =>
                      handleCategoryChange(option.value, e.target.checked)
                    }
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
                    checked={committees.includes(option.value)}
                    onChange={(e) =>
                      handleCommitteeChange(option.value, e.target.checked)
                    }
                  />
                }
                label={option.label}
              />
            ))}
          </FormGroup>
        </Box>

        {hasActiveFilters && (
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
              onClick={handleResetFilters}
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