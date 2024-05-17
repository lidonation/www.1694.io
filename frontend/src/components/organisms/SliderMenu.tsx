import React from 'react';

const SliderMenu = ({ options }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex flex-row items-center justify-center gap-4">
        {options.map((option, index) => (
          <div
            key={index}
            className="flex flex-col items-center justify-center gap-2"
          >
            <p>{option.name}</p>
            <p className="text-sm font-light text-gray-800">{option.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SliderMenu;
