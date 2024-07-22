'use client';

import React, { MouseEvent, useState } from 'react';
import Popover from '@mui/material/Popover';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
} from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function DRepListSort() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const searchParams = useSearchParams();
  const pathName = usePathname();
  const { replace } = useRouter();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;

    const params = new URLSearchParams(searchParams);

    if (checked) {
      const [sortBy, order] = name.split('-');
      params.set('sortBy', sortBy);
      params.set('order', order);
      params.set('page', '1');
    } else {
      params.delete('sortBy');
      params.delete('order');
    }

    replace(`${pathName}?${params.toString()}`);
  };

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'sort-popover' : undefined;

  return (
    <div>
      <button aria-describedby={id} onClick={handleClick}>
        <img src="/svgs/arrows-sort.svg" alt="Arrows Sort" />
      </button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
      >
        <Box className="flex flex-col space-y-4 px-6 py-3">
          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">Sort by Voting Power</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      searchParams.get('sortBy')?.toString() === 'power' &&
                      searchParams.get('order')?.toString() === 'desc'
                    }
                    onChange={handleChange}
                    name="power-desc"
                  />
                }
                label="Highest to Lowest"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      searchParams.get('sortBy')?.toString() === 'power' &&
                      searchParams.get('order')?.toString() === 'asc'
                    }
                    onChange={handleChange}
                    name="power-asc"
                  />
                }
                label="Lowest to Highest"
              />
            </FormGroup>
          </FormControl>

          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">Sort by Delegators count</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      searchParams.get('sortBy')?.toString() === 'delegators' &&
                      searchParams.get('order')?.toString() === 'desc'
                    }
                    onChange={handleChange}
                    name="delegators-desc"
                  />
                }
                label="Highest to Lowest"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={
                      searchParams.get('sortBy')?.toString() === 'delegators' &&
                      searchParams.get('order')?.toString() === 'asc'
                    }
                    onChange={handleChange}
                    name="delegators-asc"
                  />
                }
                label="Lowest to Highest"
              />
            </FormGroup>
          </FormControl>
        </Box>
      </Popover>
    </div>
  );
}
