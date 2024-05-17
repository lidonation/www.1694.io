import React from 'react';
import DRepIntroText from '../molecules/DRepIntroText';
import DRepIntroImgs from '../molecules/DRepIntroImgs';
import Button from "@/components/atoms/Button";
import Link from "next/link";

const DRepIntro = () => {
  return (
    <div className="container grid grid-cols-2 gap-4 py-10">
      <div className="col-span-1">
        <DRepIntroText />
      </div>

      <div className="col-span-1">
        <DRepIntroImgs />
      </div>

      <div className="col-span-2">
          <Button sx={{width: 'fit-content'}} variant="contained">
              <Link href={'/dreps/workflow/profile/new'}>
                  Create Your Campaign
              </Link>
          </Button>
      </div>
    </div>
  );
};

export default DRepIntro;
