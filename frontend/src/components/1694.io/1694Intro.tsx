import React from 'react';
import CIPIntroText from './1694IntroText';
import DRepIntroImgs from '../molecules/DRepIntroImgs';

const CIPIntro = () => {
  return (
    <div className="base_container flex w-full flex-col-reverse items-center gap-4 py-16 lg:flex-row">
      <CIPIntroText />
      <DRepIntroImgs />
    </div>
  );
};

export default CIPIntro;
