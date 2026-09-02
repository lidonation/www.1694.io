import { useScreenDimension } from '@/hooks';
import React from 'react';

const DRepIntroImgs = () => {
  const { isMobile } = useScreenDimension();
  return (
    <div className="img_container relative mt-10 mb-5 ml-8 flex shrink-0 items-center justify-center">
      <div
        id="rainbow"
        className="responsive-img absolute top-20 -left-20 z-20"
      >
        <img
          src="/img/faces/img1.png"
          alt="Img1"
          width={`${isMobile ? '70%' : '90%'}`}
        />
      </div>
      <div id="dull" className="responsive-img absolute -top-20 left-30 z-30">
        <img
          src="/img/faces/img2.png"
          alt="Img2"
          width={`${isMobile ? '70%' : '90%'}`}
        />
      </div>
      <div id="main" className="z-10">
        <img src="/img/faces/img3.png" alt="Img3" />
      </div>
      <div
        id="inverse"
        className="responsive-img absolute -top-10 -right-10 z-30"
      >
        <img
          src="/img/faces/img4.png"
          alt="Img4"
          width={`${isMobile ? '70%' : '90%'}`}
        />
      </div>
    </div>
  );
};

export default DRepIntroImgs;
