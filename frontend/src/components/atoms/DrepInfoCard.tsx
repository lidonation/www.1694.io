import React from 'react';

const DrepInfoCard = ({ img, title, description }) => {
  return (
    <div className="flex h-[269px] w-[286px] flex-col items-start justify-center rounded-lg bg-blue-800 p-5 shadow-lg">
      <img src={img} alt={title} width={'60px'} className="mb-3" />
      <p className="mb-3 text-lg font-extrabold">{title}</p>
      <p className="text-sm font-extralight">{description}</p>
    </div>
  );
};

export default DrepInfoCard;
