'use client';

import DRepProfileBar from "@/components/atoms/DrepProfileBar";

export default function DrepProfileRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
    <DRepProfileBar/>
      {children}
    </>
      
  );
}
