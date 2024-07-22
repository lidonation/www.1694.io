import { Box, Skeleton } from '@mui/material';
import React from 'react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  moveToFirstPage?: Function;
  moveToPreviousPage?: Function;
  moveToNextPage?: Function;
  moveToLastPage?: Function;
};

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  moveToFirstPage,
  moveToPreviousPage,
  moveToNextPage,
  moveToLastPage,
}: PaginationProps) => {
  return (
    <>
      {!totalItems && totalPages && currentPage ? (
        <Box className="flex flex-col gap-1">
          <Skeleton variant="rounded" height={45} width={290} />
          <Box className="flex justify-end">
            <Skeleton variant="rounded" height={20} width={80} />
          </Box>
        </Box>
      ) : (
        <Box className="flex flex-col items-end space-y-2">
          <Box className="flex items-center rounded-lg bg-gray-800 px-1 py-1">
            <Box
              className="flex cursor-pointer items-center space-x-1 rounded-lg py-2 pl-2 pr-1 text-white hover:bg-blue-800 sm:pr-3"
              onClick={() => moveToFirstPage(1)}
            >
              <img
                src="/svgs/pagination/chevrons-left.svg"
                alt="Navigate to first page"
                className="h-5 w-5"
              />
              <span className="text-xs font-medium">First</span>
            </Box>
            <Box
              className="flex cursor-pointer items-center space-x-1 rounded-lg py-2 pl-2 pr-3 text-white hover:bg-blue-800"
              onClick={() => moveToPreviousPage(currentPage - 1)}
            >
              <img
                src="/svgs/pagination/chevron-left.svg"
                alt="Navigate to the previous page"
                className="h-5 w-5"
              />
            </Box>
            <Box className="cursor-default rounded-lg bg-blue-800 px-3  py-2 text-xs font-medium text-white sm:mx-3">
              <span>Page {currentPage}</span>
            </Box>
            <Box
              className="flex cursor-pointer items-center space-x-1 rounded-lg py-2 pl-3 pr-2 text-white hover:bg-blue-800"
              onClick={() => moveToNextPage(currentPage + 1)}
            >
              <img
                src="/svgs/pagination/chevron-right.svg"
                alt="Navigate to the next page"
                className="h-5 w-5"
              />
            </Box>
            <Box
              className="flex cursor-pointer items-center space-x-1 rounded-lg py-2 pl-2 pr-1 text-white hover:bg-blue-800 sm:pr-3"
              onClick={() => moveToLastPage(totalPages)}
            >
              <span className="text-xs font-medium">Last</span>
              <img
                src="/svgs/pagination/chevrons-right.svg"
                alt="Navigate to first page"
                className="h-5 w-5"
              />
            </Box>
          </Box>
          <span className="textColor2 mr-2 text-sm">
            Total DReps: {totalItems}
          </span>
        </Box>
      )}
    </>
  );
};

export default Pagination;
