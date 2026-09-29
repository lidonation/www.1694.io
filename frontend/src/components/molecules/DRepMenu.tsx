'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DRepMenu() {
  const pathname = usePathname();
  const isActive = !!pathname && pathname.includes('dreps');

  return (
    <Link
      href="https://www.1694.io/en/dreps/list"
      className={isActive ? 'text-orange-500' : 'text-gray-800'}
    >
      DReps
    </Link>
  );
}
