import React from 'react';
import CIPIntroText from './1694IntroText';
import CIPIntroImgs from './1694IntroImgs';

const CIPIntro = () => {
  return (
    <div className="relative flex w-full flex-row py-20">
      <CIPIntroText />
      <CIPIntroImgs />
    </div>
  );
};

export default CIPIntro;
