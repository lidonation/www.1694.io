'use client';
import Button from '@/components/atoms/Button';
import { useDRepContext } from '@/context/drepContext';
import Link from 'next/link';
import React from 'react';

const page = () => {
  const { drepId, setStep1Status } = useDRepContext();
  return (
    <div className="flex min-h-screen flex-col gap-6 px-10">
      <h1 className="text-4xl lg:text-6xl">Profile Created Successfully!</h1>
      <div>
        <p>
          Your DRep Profile has been created successfully
        </p>
      </div>
      <div className="flex items-center justify-center gap-5 lg:flex-row mt-6">
        <Button
          variant="outlined"
          bgColor="transparent"
          handleClick={() => setStep1Status('update')}
        >
          <Link className="w-fit" href="/dreps/workflow/profile/update/step1">
            Make Changes
          </Link>
        </Button>
        <Button>
          <Link className="w-fit" href={`/dreps/${drepId}`}>
            View your Profile
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default page;
