import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export function useProposalFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSelectedCategories(searchParams.get('category')?.split(',') || []);
    setSortBy(searchParams.get('sortBy') || 'createdAt');
    setSortOrder((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc');
  }, [searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const query = new URLSearchParams();

      if (search) query.set('search', search);
      if (sortBy !== 'createdAt') query.set('sortBy', sortBy);
      if (sortOrder !== 'desc') query.set('sortOrder', sortOrder);
      if (selectedCategories.length > 0) query.set('category', selectedCategories.join(','));
      if (currentPage > 1) query.set('page', currentPage.toString());

      router.push(`?${query.toString()}`, { scroll: false });
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, sortBy, sortOrder, selectedCategories, currentPage, router]);

  return {
    currentPage,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    showFilter,
    setShowFilter,
    showSort,
    setShowSort,
    selectedCategories,
    setSelectedCategories,
  };
}
