'use client';
import React, { useRef, useEffect } from 'react';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import {
  Box,
  IconButton,
  Paper,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
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
  setSortBy: (value: string) => void;
  setSortOrder: (value: 'asc' | 'desc') => void;
  setSearch: (value: string) => void;
}

const categoryOptions: FilterOption[] = [
  { label: 'Core', value: 'Core' },
  { label: 'Research', value: 'Research' },
  { label: ' Governance Support' , value: 'Governance Support' },
  { label: 'Marketing & Innovation', value: 'Marketing & Innovation' },
  { label: 'None of these', value: 'None of these' },
];

const ProposalFilter: React.FC<ProposalFilterProps> = ({
  showFilter,
  setShowFilter,
  setShowSort,
  selectedCategories,
  setSelectedCategories,
  setSortBy,
  setSortOrder,
  setSearch,
}) => {
  const filterRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showFilter &&
        filterRef.current &&
        !filterRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setShowFilter(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilter]);

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton
        ref={filterButtonRef}
        color="primary"
        onClick={() => {
          setShowFilter((prev) => !prev);
          setShowSort(false);
        }}
        aria-label="Filter"
      >
        <FilterAltIcon />
      </IconButton>

      {showFilter && (
        <Paper
          ref={filterRef}
          elevation={4}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 10,
            mt: 1,
            width: 300,
            p: 2,
            bgcolor: '#f1f3fe',
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ borderBottom: '1px solid #e0e0e0', pb: 1, color: 'text.secondary' }}
          >
            Filter by Category
          </Typography>

          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <RadioGroup
              name="category"
              value={selectedCategories[0] || ''}
              onChange={(e) => {
                // const value = e.target.value;
                // if (selectedCategories.includes(value)) {
                //   setSelectedCategories([]);
                //   setSortBy('createdAt');
                //   setSortOrder('desc');
                //   setSearch('');
                // } else {
                //   setSelectedCategories([value]);
                // }
              }}
            >
              {categoryOptions.map((option) => (
                <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio color="primary" />}
                label={option.label}
                sx={{
                  alignItems: 'center',
                  mb: 1,
                  ml: 0,
                  '.MuiFormControlLabel-label': {
                    fontSize: '0.95rem',
                  },
                  '.MuiRadio-root': {
                    padding: '4px', 
                    marginRight: '8px', 
                  },
                }}
              />
              ))}
            </RadioGroup>
          </FormControl>

          {selectedCategories.length > 0 && (
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button
                variant="contained"
                size="small"
                sx={{
                  borderRadius: '9999px',
                  backgroundColor: '#002e9f',
                  textTransform: 'none',
                  '&:hover': { backgroundColor: '#001c6f' },
                }}
                onClick={() => {
                  setSelectedCategories([]);
                  setSortBy('createdAt');
                  setSortOrder('desc');
                  setSearch('');
                }}
              >
                Reset filters
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ProposalFilter;
