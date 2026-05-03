'use client';

import { useEffect } from 'react';

export default function GlobalError({ error }) {
  useEffect(() => {
    //@todo
    // Capture and report the error as soon as the component mounts or the error changes.
  }, [error]);

  return (
    <html>
      <body className="flex h-screen flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
