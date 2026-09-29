'use client';
import React from 'react';
import { Link, usePathname } from '@/navigation';

export default function DRepMenu() {
  const pathname = usePathname();
  const isActive = !!pathname && pathname.startsWith('/dreps');

  return (
    <Link
      href="/dreps/list"
      data-testid="nav-dreps-link"
      className={isActive ? 'text-orange-500' : 'text-gray-800'}
    >
      DReps
    </Link>
  );
}
