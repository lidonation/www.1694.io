import React from 'react';

const DRepIntroImgs = () => {
  return (
    <div className="img_container relative h-[549px] w-full mx-auto border border-black">
      {/* rainbow one */}
      <div className="absolute left-0 top-24 z-20">
        <img src="/img/faces/img1.png" alt="Img1" width={'70%'} />
      </div>
      {/* the dull one */}
      <div className="absolute left-52 top-12 z-30">
        <img src="/img/faces/img2.png" alt="Img2" width={'60%'} />
      </div>
      {/* feathered one */}
      <div className="absolute bottom-0 right-0 z-10">
        <img src="/img/faces/img3.png" alt="Img3" width={'80%'} />
      </div>
      {/* inverse one */}
      <div className="absolute right-10 top-20 z-30 ">
        <img width={'50%'} src="/img/faces/img4.png" alt="Img4" />
      </div>
    </div>
  );
};

export default DRepIntroImgs;
