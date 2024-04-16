"use client";
import DRepInfo from "@/components/organisms/DRepInfo";
import DRepIntro from "@/components/organisms/DRepIntro";
import GovernanceActionsCard from "@/components/organisms/GovernanceActionsCard";
import PickADRep from "@/components/organisms/PickADRep";
import { useDRepContext } from "@/context/drepContext";
import React, { useEffect, useState } from "react";

const page = ({ params: { locale } }) => {
  const { setCurrentLocale } = useDRepContext();
  useEffect(() => {
    setCurrentLocale(locale);
  }, []);
  return (
    <div>
      <DRepIntro />
      <DRepInfo />
      <PickADRep />
      <GovernanceActionsCard />
    </div>
  );
};

export default page;
