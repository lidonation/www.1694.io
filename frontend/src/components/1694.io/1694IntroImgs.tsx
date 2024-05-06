import React from 'react';

const CIPIntroImgs = () => {
  return (
    <div className="w-full">
      {/* rainbow one */}
      <div className="absolute right-56 top-44 z-40">
        <img src="/img/faces/img1.png" alt="Img1" width={'278px'} />
      </div>
      {/* the dull one */}
      <div className="absolute right-52 top-0 z-40">
        <img src="/img/faces/img2.png" alt="Img2" width={'170px'} />
      </div>
      {/* feathered one */}
      <div className="absolute bottom-0 right-0 z-10">
        <img src="/img/faces/img3.png" alt="Img3" width={'478px'} />
      </div>
      {/* inverse one */}
      <div className="absolute right-32 top-28 z-20 ">
        <img width={'133px'} src="/img/faces/img4.png" alt="Img4" />
      </div>
    </div>
  );
};

export default CIPIntroImgs;
