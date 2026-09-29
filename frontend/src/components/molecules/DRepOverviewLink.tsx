'use client';
import React from 'react';
import Button from '@/components/atoms/Button';
import { Link } from '@/navigation';

export default function DRepOverviewLink() {
  return (
    <Button
      component={Link}
      href="/dreps"
      size="extraLarge"
      className="shrink-0"
    >
      Learn about DReps
    </Button>
  );
}
