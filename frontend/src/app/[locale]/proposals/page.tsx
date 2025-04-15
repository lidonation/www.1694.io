'use client';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SortIcon from '@mui/icons-material/SwapVert';
import ProposalCard from '@/components/molecules/ProposalCard';
import ProposalCardSkeleton from '@/components/1694.io/ProposalCardSkeleton';
import { useGetActionsProposalsQuery } from '@/hooks/useGetActionsProposalsQuery';
import React, { useState, useRef, useEffect } from 'react';
import Pagination from '@/components/molecules/Pagination';
import { useSearchParams, useRouter } from 'next/navigation';

type FilterOption = {
  label: string;
  value: string;
};

const categoryOptions: FilterOption[] = [
  { label: 'Core', value: 'Core' },
  { label: 'Research', value: 'Research' },
];

const sortOptions: FilterOption[] = [
  { label: 'Budget', value: 'budget' },
  { label: 'Alphabetical', value: 'alphabetical' },
  { label: 'Last Modified', value: 'lastModified' },
  { label: 'Conversion Rate', value: 'conversionRate' },
];

function ProposalsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(12);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const sortButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        filterRef.current &&
        !filterRef.current.contains(target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(target)
      ) {
        setShowFilter(false);
      }

      if (
        sortRef.current &&
        !sortRef.current.contains(target) &&
        sortButtonRef.current &&
        !sortButtonRef.current.contains(target)
      ) {
        setShowSort(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const searchFromUrl = searchParams.get('search') || '';
    const categoryFromUrl = searchParams.get('category') || '';
    const sortByFromUrl = searchParams.get('sortBy') || 'createdAt';
    const sortOrderFromUrl = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
    setSearch(searchFromUrl);
    setSelectedCategories(categoryFromUrl ? categoryFromUrl.split(',') : []);
    setSortBy(sortByFromUrl);
    setSortOrder(sortOrderFromUrl);
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const query = new URLSearchParams();

      if (search) query.set('search', search);
      if (sortBy && sortBy !== 'createdAt') query.set('sortBy', sortBy);
      if (sortOrder && sortOrder !== 'desc') query.set('sortOrder', sortOrder);
      if (selectedCategories.length > 0) {
        query.set('category', selectedCategories.join(','));
      }
      if (currentPage > 1) {
        query.set('page', currentPage.toString());
      }

      router.push(`?${query.toString()}`, { scroll: false });
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [search, sortBy, sortOrder, selectedCategories, currentPage, router]);

  const { actionsProposals, isActionsProposalsLoading } = useGetActionsProposalsQuery(
    currentPage,
    pageSize,
    search,
    selectedCategories.join(','),
    sortBy,
    sortOrder,
  );

  const totalPages = actionsProposals?.meta?.pagination?.pageCount || 1;
  const totalItems = actionsProposals?.meta?.pagination?.total || 0;

  return (
    <div className="base_container min-h-screen py-10">
      <section className="mb-6">
        <h2 className="text-7xl font-black">Proposals</h2>
      </section>

      <section className="relative mb-6 flex items-center gap-1 rounded-full p-2 w-full max-w-7xl mx-auto">
        <div className="flex w-full items-center rounded-full border border-blue-500 px-4 py-2 sm:w-[300px] md:w-[400px] lg:w-[1000px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-5 w-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="relative">
          <button
            ref={filterButtonRef}
            className="rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-100"
            aria-label="Filter"
            type="button"
            onClick={() => {
              setShowFilter((prev) => !prev);
              setShowSort(false);
            }}
          >
            <FilterAltIcon className="h-8 w-10 bg-transparent hover:bg-transparent" />
          </button>

          {showFilter && (
            <div
              ref={filterRef}
              className="absolute left-0 top-full z-50 mt-2 w-72 space-y-4 rounded-lg bg-[#f1f3fe] p-4 shadow-lg"
            >
              <div>
                <p className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-700">
                  Filter by Category
                </p>
                <div className="mt-3 space-y-3">
                  {categoryOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-start space-x-3 text-sm text-gray-700"
                    >
                      <input
                        type="radio"
                        name="category"
                        className="h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedCategories.includes(option.value)}
                        onChange={() => {
                          if (selectedCategories.includes(option.value)) {
                            setSelectedCategories([]);
                            setSortBy('createdAt');
                            setSortOrder('desc');
                            setSearch('');
                          } else {
                            setSelectedCategories([option.value]);
                          }
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedCategories.length > 0 && (
                <div className="flex justify-end pt-4">
                  <button
                    className="rounded-full bg-[#002e9f] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors duration-200"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSortBy('createdAt');
                      setSortOrder('desc');
                      setSearch('');
                    }}
                  >
                    Reset filters
                  </button>
                </div>

              )}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            ref={sortButtonRef}
            className="h-10 w-10 rounded-full p-2 text-blue-600 transition-colors hover:bg-blue-100"
            aria-label="Sort"
            type="button"
            onClick={() => {
              setShowSort((prev) => !prev);
              setShowFilter(false);
            }}
          >
            <SortIcon className="h-8 w-10" />
          </button>

          {showSort && (
            <div
              ref={sortRef}
              className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg bg-[#f1f3fe] p-4 shadow-lg flex flex-col"
            >
              <p className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-700">
                Sort Proposals by:
              </p>

              <div className="space-y-4 flex-1 mt-4">
                <label className="flex cursor-pointer items-start space-x-3 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="sortBy"
                    className="h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={sortBy === 'alphabetical'}
                    onChange={() => {
                      setSortBy('alphabetical');
                      setSortOrder('asc');
                    }}
                  />
                  <span>Alphabetical</span>
                </label>

                <label className="flex cursor-pointer items-start space-x-3 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="sortBy"
                    className="h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={sortBy === 'lastModified'}
                    onChange={() => {
                      setSortBy('lastModified');
                      setSortOrder('desc');
                    }}
                  />
                  <span>Last Modified</span>
                </label>

                <div className="pt-2">
                  <p className="text-sm font-medium text-gray-700">Budget</p>
                  <div className="mt-2 space-y-2 pl-1">
                    <label className="flex cursor-pointer items-start space-x-3 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="budgetSort"
                        className="h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={sortBy === 'budget' && sortOrder === 'desc'}
                        onChange={() => {
                          setSortBy('budget');
                          setSortOrder('desc');
                        }}
                      />
                      <span>Highest to Lowest</span>
                    </label>
                    <label className="flex cursor-pointer items-start space-x-3 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="budgetSort"
                        className="h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={sortBy === 'budget' && sortOrder === 'asc'}
                        onChange={() => {
                          setSortBy('budget');
                          setSortOrder('asc');
                        }}
                      />
                      <span>Lowest to Highest</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-sm font-medium text-gray-700">Conversion Rate</p>
                  <div className="mt-2 space-y-2 pl-1">
                    <label className="flex cursor-pointer items-start space-x-3 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="conversionSort"
                        className="h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={sortBy === 'conversionRate' && sortOrder === 'desc'}
                        onChange={() => {
                          setSortBy('conversionRate');
                          setSortOrder('desc');
                        }}
                      />
                      <span>Highest to Lowest</span>
                    </label>
                    <label className="flex cursor-pointer items-start space-x-3 text-sm text-gray-700">
                      <input
                        type="radio"
                        name="conversionSort"
                        className="h-4 w-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={sortBy === 'conversionRate' && sortOrder === 'asc'}
                        onChange={() => {
                          setSortBy('conversionRate');
                          setSortOrder('asc');
                        }}
                      />
                      <span>Lowest to Highest</span>
                    </label>
                  </div>
                </div>
              </div>

              {(sortBy !== 'createdAt' || sortOrder !== 'desc') && (
                <div className="flex justify-end pt-4">
                  <button
                    className="rounded-full bg-[#002e9f] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors duration-200"
                    onClick={() => {
                      setSortBy('createdAt');
                      setSortOrder('desc');
                    }}
                  >
                    Reset sorting
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      <section>
        <ul className="grid grid-cols-1 gap-6 py-6 lg:grid-cols-2 xl:grid-cols-3">
          {isActionsProposalsLoading
            ? [...Array(pageSize)].map((_, index) => (
              <li key={index}>
                <ProposalCardSkeleton />
              </li>
            ))
            : actionsProposals?.data?.map((proposal, index) => (
              <li key={index}>
                <ProposalCard proposal={proposal} />
              </li>
            ))}
        </ul>

        {!isActionsProposalsLoading && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              dataType="proposals"
            />
          </div>
        )}
      </section>
    </div>
  );
}

export default ProposalsPage;
