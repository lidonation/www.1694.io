'use client';
import { Background } from '@/components/atoms/Background';
import BreadCrumbs from '@/components/molecules/BreadCrumbs';
import DRepInfo from '@/components/organisms/DRepInfo';
import DRepIntro from '@/components/organisms/DRepIntro';
import GovernanceActionsCard from '@/components/organisms/GovernanceActionsCard';
import PickADRep from '@/components/organisms/PickADRep';
import { useDRepContext } from '@/context/drepContext';
import React, { useEffect, use } from 'react';

const page = props => {
  const params = use(props.params);

  const {
    locale
  } = params;

  const { setCurrentLocale } = useDRepContext();
  useEffect(() => {
    setCurrentLocale(locale);
  }, []);
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
