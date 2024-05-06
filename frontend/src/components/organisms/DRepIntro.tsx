import React from 'react';
import DRepIntroText from '../molecules/DRepIntroText';
import DRepIntroImgs from '../molecules/DRepIntroImgs';

const DRepIntro = () => {
  return (
    <div className="container grid grid-cols-2 gap-4 py-10">
      <div className="col-span-1">
        <DRepIntroText />
      </div>

      <div className="col-span-1">
        <DRepIntroImgs />
      </div>
    </div>
  );
};

export default DRepIntro;
