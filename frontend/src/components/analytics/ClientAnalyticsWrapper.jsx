'use client';

import dynamic from 'next/dynamic';

// Dynamically imported ClientScriptLoader with no SSR
const SprigClientScriptLoader = dynamic(
  () => import('@/components/analytics/SprigClientScriptLoader'),
  { ssr: false }
);

const FathomClientScriptLoader = dynamic(
  () => import('@/components/analytics/AnalyticsLoader'),
  { ssr: false }
);

export default function ClientAnalyticsWrapper() {
  return (
    <>
      <SprigClientScriptLoader />
      <FathomClientScriptLoader />
    </>
  );
}