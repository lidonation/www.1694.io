'use client';

import React, { MouseEvent, useEffect, useState } from 'react';
import Popover from '@mui/material/Popover';
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  Grow,
  IconButton,
  Radio,
  RadioGroup,
  Switch,
} from '@mui/material';
import {
  DREP_FILTERS_LS_KEY,
  getItemFromLocalStorage,
  setItemToLocalStorage,
  removeItemFromLocalStorage,
} from '@/lib/localStorage';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Button from '../atoms/Button';
import DotIcon from '../atoms/svgs/DotIcon';

export default function DRepListFilters() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const searchParams = useSearchParams();
  const pathName = usePathname();
  const { replace } = useRouter();
  const params = new URLSearchParams(searchParams.toString());

  const FILTER_KEYS = ['on_chain', 'campaign', 'type', 'include_retired'];

  const getFiltersFromSearchParams = () =>
    Object.fromEntries(
      FILTER_KEYS.map((key) => [key, searchParams.get(key) || ''])
    );

    useEffect(() => {
      const filters = getFiltersFromSearchParams();
      const hasActiveFilters = Object.values(filters).some(Boolean);
    
      if (!hasActiveFilters) {
        const savedFilters = getItemFromLocalStorage(DREP_FILTERS_LS_KEY);
        if (savedFilters) {
          FILTER_KEYS.forEach((key) => {
            if (savedFilters[key]) {
              params.set(key, savedFilters[key]);
            }
          });
          replace(`${pathName}?${params.toString()}`);
        }
      }
    
      setIsFiltering(hasActiveFilters);
      setIsInitializing(false);
    }, [searchParams.toString()]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    filter: string,
  ) => {
    const value = event.target.value;
    updateFilters(filter, value);
  };

  const updateFilters = (filter: string, value: string) => {
    if (filter && value) {
      params.set(filter, value);
      params.set('page', '1');
    } else {
      params.delete(filter);
    }
  
    const updatedFilters = FILTER_KEYS.reduce((acc, key) => {
      const filterKeyValue = key === filter ? value : searchParams.get(key);
      if (filterKeyValue) acc[key] = filterKeyValue;
      return acc;
    }, {} as Record<string, string>);
  
    setItemToLocalStorage(DREP_FILTERS_LS_KEY, updatedFilters);
  
    setIsFiltering(true);
    replace(`${pathName}?${params.toString()}`);
  };

  const resetFilters = (filters: string[]) => {
    filters.forEach((filter) => params.delete(filter));
    removeItemFromLocalStorage(DREP_FILTERS_LS_KEY);
    replace(`${pathName}?${params.toString()}`);
  };
  const getFilterValue = (key: string) => searchParams.get(key) || '';

  const handleShow = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'filters-popover' : undefined;

  return !isInitializing ? (
    <Box>
      <Box
        component="button"
        className="relative flex w-6 justify-start"
        aria-describedby={id}
        onClick={handleShow}
      >
        <IconButton color="primary" sx={{ width: 40, height: 40 }}>
          <img
            src="/svgs/filter.svg"
            className="mt-1 h-5 w-5"
            alt="Filter Sort"
          />
        </IconButton>

          <Grow in={isFiltering}>
          <div className="absolute right-0 top-0">
            <DotIcon color="#f97316" width={17} height={17} />
          </div>
        </Grow>
      </Box>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        sx={{
          '.MuiPaper-root': {
            borderRadius: '0 0 1rem 1rem',
            boxShadow: '1px 2px 11px 0 rgba(0, 18, 61, 0.37)',
            bgcolor: '#F3F5FF',
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box className="bg-extra_gray px-6 py-4">
          <p className="text-sm font-semibold">Filter DReps by:</p>
          <Box className="mt-2 flex flex-col">
            <FormControl>
              <span className="text-xs font-semibold">
                Filter DReps by On-chain Status
              </span>
              <RadioGroup
                name="drep-on-chain-status"
                value={getFilterValue('on_chain')}
                onChange={(e) => {
                  handleChange(e, 'on_chain');
                }}
              >
                <FormControlLabel
                  value="active"
                  control={
                    <Radio
                      sx={{
                        '&.Mui-checked': {
                          color: '#f97316',
                        },
                      }}
                    />
                  }
                  label="Active"
                />
                <FormControlLabel
                  value="inactive"
                  control={
                    <Radio
                      sx={{
                        '&.Mui-checked': {
                          color: '#f97316',
                        },
                      }}
                    />
                  }
                  label="Inactive"
                />
              </RadioGroup>
            </FormControl>

            <Divider />

            <FormControl>
              <span className="mt-2 text-xs font-semibold">
                Filter DReps by Campaign Status
              </span>
              <RadioGroup
                name="drep-campaign-status"
                value={getFilterValue('campaign')}
                onChange={(e) => {
                  handleChange(e, 'campaign');
                }}
              >
                <FormControlLabel
                  value="claimed"
                  control={
                    <Radio
                      sx={{
                        '&.Mui-checked': {
                          color: '#f97316',
                        },
                      }}
                    />
                  }
                  label="Claimed"
                />
                <FormControlLabel
                  value="unclaimed"
                  control={
                    <Radio
                      sx={{
                        '&.Mui-checked': {
                          color: '#f97316',
                        },
                      }}
                    />
                  }
                  label="Unclaimed"
                />
              </RadioGroup>
            </FormControl>

            <Divider />

            <FormControl>
              <span className="mt-2 text-xs font-semibold">
                Filter DReps by DRep type
              </span>
              <RadioGroup
                name="drep-types"
                value={getFilterValue('type')}
                onChange={(e) => {
                  handleChange(e, 'type');
                }}
              >
                <FormControlLabel
                  value="has_script"
                  control={
                    <Radio
                      sx={{
                        '&.Mui-checked': {
                          color: '#f97316',
                        },
                      }}
                    />
                  }
                  label="Scripted DReps"
                />
              </RadioGroup>
            </FormControl>

            <Divider />

            <FormControl>
              <FormControlLabel
                value="include_retired"
                control={
                  <Switch
                    checked={getFilterValue('include_retired') === 'true'}
                    onChange={(e) =>
                      updateFilters(
                        'include_retired',
                        e.target.checked ? 'true' : '',
                      )
                    }
                    name="include_retired"
                  />
                }
                label={
                  getFilterValue('include_retired') === 'true'
                    ? 'Including Retired DReps'
                    : 'Excluding Retired DReps'
                }
              />
            </FormControl>
          </Box>
          {isFiltering && (
            <Box className="flex justify-end">
              <Button
                sx={{
                  backgroundColor: '#1f2937',
                }}
                size="extraSmall"
                handleClick={() =>
                  resetFilters(FILTER_KEYS)}
              >
                <span>Reset</span>
              </Button>
            </Box>
          )}
        </Box>
      </Popover>
    </Box>
  ) : null;
}
