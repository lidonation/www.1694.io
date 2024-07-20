import { Typography } from '@mui/material';
import React, { useState } from 'react';

const HoverText = ({ shortText, longText }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="px-4 py-2"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Typography variant="body1">₳ {hover ? longText : shortText}</Typography>
    </div>
  );
};

export default HoverText;
