'use client';
import DRepsMetrics from '@/components/atoms/DRepsMetrics';
import DRepTableSearch from '@/components/atoms/DRepTableSearch';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import DRepsTable from '@/components/molecules/DRepsTable';
import DRepFilterChips from '@/components/atoms/DRepFilterChips';
import React, { use } from 'react';

type PageProps = {
  searchParams: Promise<{
    s?: string;
    page?: string;
    sort?: string;
    order?: string;
    on_chain?: string;
    include_retired?: string;
    campaign?: string;
    type?: string;
  }>;
};

const page = ({ searchParams }: PageProps) => {
  const params = use(searchParams);
  const query = params?.s || '';
  const page = Number(params?.page) || 1;
  const sort = params?.sort || null;
  const order = params?.order || null;
  const onChainStatus = params?.on_chain || null;
  const includeRetired = params?.include_retired || null;
  const campaignStatus = params?.campaign || null;
  const type = params?.type || null;

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
