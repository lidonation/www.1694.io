import React from 'react';
import DatabaseNullIcon from '../atoms/svgs/DatabaseNullIcon';

type RecordsNotFoundProps = {
  message?: string;
};

function RecordsNotFound({ message }: RecordsNotFoundProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 hover:border-gray-400">
      <DatabaseNullIcon width={60} height={50} />
      <span className="mt-2 block text-sm font-medium text-gray-500">
        {message || 'No records found.'}
      </span>
    </div>
  );
}

export default RecordsNotFound;
