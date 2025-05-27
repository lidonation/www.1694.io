'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import DRepListFilters from '../molecules/DRepListFilters';
import ListSort from '../molecules/ListSort';
import { Box } from '@mui/material';

const DRepTableSearch = () => {
  const searchParams = useSearchParams();
  const pathName = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set('s', term);
      params.set('page', '1');
    } else {
      params.delete('s');
    }
    replace(`${pathName}?${params.toString()}`);
  }, 300);

  return (
    <Box className="flex w-full items-center gap-2">
      <Box className="relative flex w-full flex-row items-center justify-start rounded-full border border-primary-300">
        <Box className="pointer-events-none absolute flex items-center justify-center pl-6">
          <img src="/svgs/search.svg" alt="Search Icon" />
        </Box>
        <input
          type="text"
          defaultValue={searchParams.get('s')?.toString()}
          onChange={(e) => handleSearch(e.target.value)}
          data-test-id="drep-search-input"
          className="h-full w-full rounded-full bg-transparent py-3 pl-14 pr-6 ring-primary-300 placeholder:font-black focus:border-none focus:ring-2"
          placeholder="Search..."
        />
      </Box>
      <Box className="flex items-center gap-4">
        <DRepListFilters />
        <ListSort
          tableType="DReps"
          sortOptions={[
            {
              category: 'Active Voting Power',
              options: [
                { label: 'Highest to Lowest', value: 'voting_power-desc' },
                { label: 'Lowest to Highest', value: 'voting_power-asc' },
              ],
            },
            {
              category: 'Live Voting Power',
              options: [
                { label: 'Highest to Lowest', value: 'live_stake-desc' },
                { label: 'Lowest to Highest', value: 'live_stake-asc' },
              ],
            },
            {
              category: 'Delegators Count',
              options: [
                { label: 'Highest to Lowest', value: 'delegators-desc' },
                { label: 'Lowest to Highest', value: 'delegators-asc' },
              ],
            },
            {
              category: 'Governance Votes',
              options: [
                { label: 'Highest to Lowest', value: 'votes-desc' },
                { label: 'Lowest to Highest', value: 'votes-asc' },
              ],
            },
          ]}
        />
      </Box>
    </Box>
  );
};

export default DRepTableSearch;
