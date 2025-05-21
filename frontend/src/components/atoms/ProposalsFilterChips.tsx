'use client';

import React from 'react';
import { Chip, Box } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  PROPOSAL_FILTERS_LS_KEY,
  PROPOSAL_SORT_LS_KEY,
  setItemToLocalStorage,
  removeItemFromLocalStorage,
} from '@/lib/localStorage';

type FilterKey = 'categories' | 'committees' | 'sort' | 'order';

type FilterKeyConfig = {
  key: string;
  label: string;
};

const FILTER_KEYS: FilterKeyConfig[] = [
  { key: 'categories', label: 'Category' },
  { key: 'committees', label: 'Committee' },
  { key: 'sort', label: 'Sort' },
];

const formatWord = (word: string): string =>
  word
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const ChipContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="flex w-fit items-center rounded-full bg-gray-800 pl-2 text-white">
    {children}
  </div>
);

const FilterChip: React.FC<{
  label: string;
  onDelete: () => void;
}> = ({ label, onDelete }) => (
  <Chip
    label={label}
    onDelete={onDelete}
    className="!bg-transparent !text-sm !text-white"
    sx={{
      '& .MuiChip-deleteIcon': {
        color: '#fff',
        '&:hover': { color: '#fff' },
      },
    }}
  />
);

export default function ProposalsFilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const removeFilter = (key: FilterKey, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
  
    if (key === 'sort' || key === 'order') {
      params.delete('sort');
      params.delete('order');
      removeItemFromLocalStorage(PROPOSAL_SORT_LS_KEY);
    } else if (value) {
      const values = params.get(key)?.split(',') || [];
      const updatedValues = values.filter((v) => v !== value);
      updatedValues.length > 0
        ? params.set(key, updatedValues.join(','))
        : params.delete(key);
    }
  
    const updatedFilters: Record<string, string[]> = {
      categories: params.get('categories')?.split(',').filter(Boolean) || [],
      committees: params.get('committees')?.split(',').filter(Boolean) || [],
    };
  
    params.set('page', '1');
    router.replace(`${pathname}?${params.toString()}`);
  
    if (updatedFilters.categories.length > 0 || updatedFilters.committees.length > 0) {
      setItemToLocalStorage(PROPOSAL_FILTERS_LS_KEY, updatedFilters);
    } else {
      removeItemFromLocalStorage(PROPOSAL_FILTERS_LS_KEY);
    }
  };
  
  const renderSortChip = () => {
    const sort = searchParams.get('sort');
    const order = searchParams.get('order');
    
    if (!sort) return null;

    return (
      <ChipContainer key="sort-order">
        <span className="text-sm font-semibold">Sort:</span>
        <FilterChip
          label={`${formatWord(sort)}${order ? ` : ${formatWord(order)}` : ''}`}
          onDelete={() => removeFilter('sort')}
        />
      </ChipContainer>
    );
  };

  const renderFilterChips = () =>
    FILTER_KEYS.flatMap(({ key, label }) => {
      if (key === 'sort') return [renderSortChip()];

      const value = searchParams.get(key);
      if (!value) return [];

      const values = value.split(',').filter(Boolean);
      return values.length > 0 ? (
        <ChipContainer key={key}>
          <span className="text-sm font-semibold">{label}:</span>
          {values.map((v) => (
            <FilterChip
              key={`${key}-${v}`}
              label={formatWord(v)}
              onDelete={() => removeFilter(key as FilterKey, v)}
            />
          ))}
        </ChipContainer>
      ) : [];
    }).filter(Boolean);
    
  return <Box className="flex flex-wrap gap-2">{renderFilterChips()}</Box>;
}
