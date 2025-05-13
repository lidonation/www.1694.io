'use client';
import React, { useRef } from 'react';
import ProposalFilter from '../molecules/ProposalFilter';
import ProposalSort from '../molecules/ProposalSort';
import { Box, InputBase, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';

interface ProposalSearchProps {
  search: string;
  setSearch: (value: string) => void;
  showFilter: boolean;
  setShowFilter: (value: boolean) => void;
  showSort: boolean;
  setShowSort: (value: boolean) => void;
  selectedCategories: string[];
  setSelectedCategories: (value: string[]) => void;
  selectedCommittees: string[];
  setSelectedCommittees: (value: string[]) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (value: 'asc' | 'desc') => void;
}

const ProposalSearch: React.FC<ProposalSearchProps> = ({
  search,
  setSearch,
  showFilter,
  setShowFilter,
  showSort,
  setShowSort,
  selectedCategories,
  setSelectedCategories,
  selectedCommittees,
  setSelectedCommittees,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClear = () => {
    setSearch('');
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
          onChange={(e) => setSearch(e.target.value)}
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
        setShowSort={setShowSort}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        selectedCommittees={selectedCommittees}
        setSelectedCommittees={setSelectedCommittees}
        setSortBy={setSortBy}
        setSortOrder={setSortOrder}
        setSearch={setSearch}
      />

      <ProposalSort
        showSort={showSort}
        setShowSort={setShowSort}
        setShowFilter={setShowFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />
    </Box>
  );
};

export default ProposalSearch;