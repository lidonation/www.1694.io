import React from 'react';
import DatabaseNullIcon from '../atoms/svgs/DatabaseNullIcon';

type RecordsNotFoundProps = {
  message?: string;
};

function RecordsNotFound({ message }: RecordsNotFoundProps) {
  return (
    <div className="w-full rounded-xl bg-white p-6 shadow-sm">
      <div className="w-full rounded-md border-2 border-dashed border-gray-300 px-4 py-12 flex flex-col items-center justify-center">
        <DatabaseNullIcon width={60} height={50} />
        <span className="mt-2 text-sm font-medium text-gray-500">
          {message || 'No records found.'}
        </span>
      </div>
    </div>
  );
}

export default RecordsNotFound;
