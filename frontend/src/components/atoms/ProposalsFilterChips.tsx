'use client';

import React from 'react';
import { Chip, Box } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type FilterKey = {
  key: string;
  label: string;
};

const FILTER_KEYS: FilterKey[] = [
  { key: 'categories', label: 'Category' },
  { key: 'committees', label: 'Committee' },
  { key: 'sort', label: 'Sort' },
];

const formatWord = (word: string): string =>
  word
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const ChipContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center bg-black text-white rounded-full px-2 py-1 w-fit">
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
    className="!bg-transparent !text-white !text-sm"
    sx={{
      '& .MuiChip-deleteIcon': {
        color: '#fff',
        '&:hover': { color: '#fff' },
      },
    }}
  />
);

export default function ProposalsFilterChips() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const removeFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (key === 'sort' || key === 'order') {
      params.delete('sort');
      params.delete('order');
    } else if (value) {
      const values = params.get(key)?.split(',') || [];
      const updatedValues = values.filter((v) => v !== value);
      updatedValues.length > 0 
        ? params.set(key, updatedValues.join(',')) 
        : params.delete(key);
    } else {
      params.delete(key);
    }

    params.set('page', '1');
    replace(`${pathname}?${params.toString()}`);
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

  const renderFilterChips = () => {
    return FILTER_KEYS.flatMap(({ key, label }) => {
      if (key === 'sort') return [renderSortChip()];

      const value = searchParams.get(key);
      if (!value) return [];

      const values = value.split(',');
      if (values.length === 0) return [];

      return (
        <ChipContainer key={key}>
          <span className="text-sm font-semibold">{label}:</span>
          {values.map((v) => (
            <FilterChip
              key={`${key}-${v}`}
              label={formatWord(v)}
              onDelete={() => removeFilter(key, v)}
            />
          ))}
        </ChipContainer>
      );
    }).filter(Boolean);
  };

  return (
    <Box className="my-4 flex flex-wrap gap-2">
      {renderFilterChips()}
    </Box>
  );
}