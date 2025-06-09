'use client';

import React from 'react';
import { Box, Chip } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  getItemFromLocalStorage,
  setItemToLocalStorage,
  removeItemFromLocalStorage,
  DREP_FILTERS_LS_KEY,
  DREP_SORT_LS_KEY,
} from '@/lib/localStorage';

const filters = [
  { label: 'On-chain', key: 'on_chain' },
  { label: 'Campaign', key: 'campaign' },
  { label: 'Type', key: 'type' },
  { label: 'Include Retired', key: 'include_retired' },
  { label: 'Sort', key: 'sort' },
  { label: 'Order', key: 'order' },
];

const filterLabelMap = {
  type: { has_script: 'Scripted' },
  sort: { voting_power: 'Voting Power' },
  order: { asc: 'Asc', desc: 'Desc' },
};

const format = (key: string, val: string) =>
  filterLabelMap[key]?.[val] ||
  val
    .split('_')
    .map(s => s[0].toUpperCase() + s.slice(1))
    .join(' ');

const labelFor = (
  key: string,
  label: string,
  search: ReturnType<typeof useSearchParams>
) => {
  const val = search.get(key);
  if (!val) return null;

  if (key === 'include_retired') {
    return val === 'true' ? 'Including Retired DReps' : null;
  }

  if (key === 'sort') {
    const sort = search.get('sort');
    const order = search.get('order');
    if (!sort) return null;
    return `Sort : ${format('sort', sort)}${order ? ` : ${format('order', order)}` : ''}`;
  }

  if (key === 'order') return null;

  return `${label} : ${format(key, val)}`;
};

export default function DRepFilterChips() {
  const search = useSearchParams();
  const path = usePathname();
  const { replace } = useRouter();

  const remove = (key: string) => {
    const params = new URLSearchParams(search.toString());
    if (key === 'sort' || key === 'order') {
      params.delete('sort');
      params.delete('order');
    } else {
      params.delete(key);
    }
    params.set('page', '1');

    // Handle filter
    const filtersStored = getItemFromLocalStorage(DREP_FILTERS_LS_KEY);
    if (filtersStored) {
      if (key !== 'sort' && key !== 'order') {
        delete filtersStored[key];
        if (Object.keys(filtersStored).length > 0) {
          setItemToLocalStorage(DREP_FILTERS_LS_KEY, filtersStored);
        } else {
          removeItemFromLocalStorage(DREP_FILTERS_LS_KEY);
        }
      }
    }

    // Handle sort
    if (key === 'sort' || key === 'order') {
      const sortStored = getItemFromLocalStorage(DREP_SORT_LS_KEY);
      if (sortStored) {
        delete sortStored['sort'];
        delete sortStored['order'];
        if (Object.keys(sortStored).length > 0) {
          setItemToLocalStorage(DREP_SORT_LS_KEY, sortStored);
        } else {
          removeItemFromLocalStorage(DREP_SORT_LS_KEY);
        }
      }
    }
    replace(`${path}?${params.toString()}`);
  };

  const activeChips = filters
    .map(({ key, label }) => ({ key, chip: labelFor(key, label, search) }))
    .filter(({ chip }) => chip !== null);

  return (
    <Box className="my-4 flex flex-wrap gap-2">
      {activeChips.map(({ key, chip }) => (
        <Chip
          key={key === 'sort' ? 'sort-order' : key}
          label={chip}
          onDelete={() => remove(key)}
          sx={{
            backgroundColor: '#1f2937',
            color: '#fff',
            fontWeight: 500,
            textTransform: 'capitalize',
            '& .MuiChip-deleteIcon': {
              color: '#fff',
              '&:hover': { color: '#fff' },
            },
          }}
        />
      ))}
    </Box>
  );
}
