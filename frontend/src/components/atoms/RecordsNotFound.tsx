import React from 'react';
import DatabaseNullIcon from '../atoms/svgs/DatabaseNullIcon';

type RecordsNotFoundProps = {
  message?: string;
};

function RecordsNotFound({ message }: RecordsNotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="flex w-full max-w-md flex-col items-center rounded-lg border-2 border-dashed border-gray-300 p-12 hover:border-gray-400">
        <DatabaseNullIcon width={60} height={50} />
        <span className="mt-2 block text-sm font-semibold text-gray-500">
          {message || 'No records found.'}
        </span>
      </div>
    </div>
  );
}

export default RecordsNotFound;
