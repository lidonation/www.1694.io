import React from 'react';
import DRepIntroText from '../molecules/DRepIntroText';
import DRepIntroImgs from '../molecules/DRepIntroImgs';
import Button from '@/components/atoms/Button';
import Link from 'next/link';

const DRepIntro = () => {
  return (
    <div className="base_container flex flex-col-reverse items-center py-24 lg:flex-row">
      <div className="flex flex-col gap-3">
        <DRepIntroText />

        <Button sx={{ width: 'fit-content' }} variant="contained">
          <Link href={'/dreps/workflow/profile/new'}>Create Your Campaign</Link>
        </Button>
      </div>

      <DRepIntroImgs />
    </div>
  );
};

export default DRepIntro;
