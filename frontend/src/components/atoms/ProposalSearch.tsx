'use client';
import React, { useRef } from 'react';
import ProposalFilter from '../molecules/ProposalFilter';
import ProposalSort from '../molecules/ProposalSort';
import { Box, InputBase, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProposalSearchProps {
  search: string;
  setSearch: (value: string) => void;
  showFilter: boolean;
  setShowFilter: (value: boolean) => void;
  showSort: boolean;
  setShowSort: (value: boolean) => void;
}

const ProposalSearch: React.FC<ProposalSearchProps> = ({
  search,
  setSearch,
  showFilter,
  setShowFilter,
  showSort,
  setShowSort,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const updateSearchParam = (value: string) => {
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    updateSearchParam(event.target.value);
  };

  const handleClear = () => {
    setSearch('');
    params.delete('search');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Box display="flex" alignItems="center" gap={1} width="100%">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          borderRadius: '9999px',
          backgroundColor: 'transparent',
          px: 2,
          py: 1,
        }}
        className="border border-primary-300"
      >
        <IconButton sx={{ p: 0, mr: 1 }} aria-label="search" disableRipple>
          <SearchIcon sx={{ color: '#3b82f6' }} />
        </IconButton>
        <InputBase
          inputRef={inputRef}
          sx={{ flex: 1, fontSize: 14 }}
          placeholder="Search..."
          inputProps={{ 'aria-label': 'search proposals' }}
          value={search}
          onChange={handleInputChange}
        />
        {search && (
          <IconButton
            onClick={handleClear}
            sx={{ p: 0, ml: 1 }}
            aria-label="clear search"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <ProposalFilter
        showFilter={showFilter}
        setShowFilter={setShowFilter}
      />

      <ProposalSort
        showSort={showSort}
        setShowSort={setShowSort}
      />
    </Box>
  );
};

export default ProposalSearch;