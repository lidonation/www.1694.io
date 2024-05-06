import React from 'react';

const DRepIntroImgs = () => {
  return (
    <div className="relative h-full w-full">
      {/* rainbow one */}
      <div className="absolute left-0 top-24 z-20">
        <img src="/img/faces/img1.png" alt="Img1" width={'278px'} />
      </div>
      {/* the dull one */}
      <div className="absolute left-52 top-12 z-30">
        <img src="/img/faces/img2.png" alt="Img2" width={'170px'} />
      </div>
      {/* feathered one */}
      <div className="absolute bottom-0 right-5 z-10">
        <img src="/img/faces/img3.png" alt="Img3" width={'478px'} />
      </div>
      {/* inverse one */}
      <div className="absolute right-10 top-20 z-30 ">
        <img width={'133px'} src="/img/faces/img4.png" alt="Img4" />
      </div>
    </div>
  );
};

export default DRepIntroImgs;
