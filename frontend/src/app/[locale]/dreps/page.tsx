'use client';
import { Background } from '@/components/atoms/Background';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import DRepInfo from '@/components/organisms/DRepInfo';
import DRepIntro from '@/components/organisms/DRepIntro';
import GovernanceActionsCard from '@/components/organisms/GovernanceActionsCard';
import PickADRep from '@/components/organisms/PickADRep';
import { useWallet } from '@/context/globalContext';
import React, { useEffect, use } from 'react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const page = ({ params }: PageProps) => {
  const { locale } = use(params);
  const { setCurrentLocale } = useWallet();
  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);
  return (
    <Background>
      <BreadCrumbs
        crumbs={[
          {
            label: 'DReps',
            href: `${locale}/dreps`,
          },
        ]}
      />
      <DRepIntro />

      <DRepInfo />

      <section>
        <PickADRep />
      </section>

      <section>
        <GovernanceActionsCard />
      </section>
    </Background>
  );
};

export default page;
