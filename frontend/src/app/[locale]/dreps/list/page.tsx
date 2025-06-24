'use client';
import React, { useEffect } from 'react';
import DRepsMetrics from '@/components/atoms/DRepsMetrics';
import DRepTableSearch from '@/components/atoms/DRepTableSearch';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import DRepsTable from '@/components/molecules/DRepsTable';
import DRepFilterChips from '@/components/atoms/DRepFilterChips';
import { useRouter } from 'next/navigation';
import { getItemFromLocalStorage, DREP_LAST_TAB_LS_KEY, LAST_DREP_ID_LS_KEY } from '@/lib/localStorage';

type PageProps = {
  searchParams?: {
    s?: string;
    page?: string;
    sort?: string;
    order?: string;
    on_chain?: string;
    include_retired?: string;
    campaign?: string;
    type?: string;
  };
};
const page = ({ searchParams }: PageProps) => {
  const router = useRouter();
  const query = searchParams?.s || '';
  const page = Number(searchParams?.page) || 1;
  const sort = searchParams?.sort || null;
  const order = searchParams?.order || null;
  const onChainStatus = searchParams?.on_chain || null;
  const includeRetired = searchParams?.include_retired || null;
  const campaignStatus = searchParams?.campaign || null;
  const type = searchParams?.type || null;

useEffect(() => {
  const lastTab = getItemFromLocalStorage(DREP_LAST_TAB_LS_KEY);
  const lastDrepId = getItemFromLocalStorage(LAST_DREP_ID_LS_KEY);
  if (lastTab && lastDrepId) {
    const tabPath = lastTab === 'profile' ? '' : `/${lastTab}`;
    const redirectUrl = `/dreps/${lastDrepId}${tabPath}`;
    router.push(redirectUrl);
  }
}, [router]);

  return (
    <div>
      <BreadCrumbs
        crumbs={[
          {
            label: 'DReps',
            href: `/dreps`,
          },
          {
            label: 'DRep List',
          },
        ]}
      />
      <div className="base_container min-h-screen py-10">
        <section className="mb-12">
          <h2 className="text-7xl font-black">Available DReps</h2>
        </section>
        <section className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <DRepsMetrics />
          <DRepTableSearch />
        </section>
        <section className="mb-5">
          <DRepFilterChips />
        </section>

        <section className="rounded-md bg-white p-5 shadow">
          <DRepsTable
            query={query}
            page={page}
            sort={sort}
            order={order}
            onChainStatus={onChainStatus}
            campaignStatus={campaignStatus}
            includeRetired={includeRetired}
            type={type}
          />
        </section>
      </div>
    </div>
  );
};

export default page;
