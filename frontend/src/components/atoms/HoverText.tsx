import { Grow, Typography } from '@mui/material';
import React, { useState } from 'react';

const HoverText = ({ shortText, longText }) => {
  const [hover, setHover] = useState(false);
  const isSameNumber = Number(shortText) === Number(longText);

  if (isSameNumber) {
    return (
      <div className="w-full cursor-pointer">
        <Typography className="inline-block w-full">₳ {shortText}</Typography>
      </div>
    );
  }

  return (
    <div
      className="w-full cursor-pointer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {!!hover && (
        <Grow in={hover}>
          <Typography className="inline-block w-full">₳ {longText}</Typography>
        </Grow>
      )}
      {!hover && (
        <Grow in={!hover}>
          <Typography className="inline-block w-full">₳ {shortText}</Typography>
        </Grow>
      )}
    </div>
  );
};

export default HoverText;
