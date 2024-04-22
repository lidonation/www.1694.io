import { useCardano } from '@/context/walletContext';
import React, { useState } from 'react';

const PostVisibilityInput = ({ visibility, setVisibility }) => {
  const {isEnabled}=useCardano()
  const [selectedVisibility, setSelectedVisibility] = useState(visibility);

  const handleChange = (event) => {
    // Update the selected visibility state when a radio button is clicked
    setSelectedVisibility(event.target.value);
    // Update the parent component's visibility state with the selected value
    setVisibility((prev) => ({ ...prev, postVisibility: event.target.value }));
  };

  return (
    <div className="flex flex-col items-start justify-center">
      <p>Set Visibility</p>
      <div className="flex flex-row items-center gap-3 ml-3">
        <input
          type="radio"
          value="everyone"
          checked={selectedVisibility === 'everyone'}
          onChange={handleChange}
          disabled={!isEnabled}
          name="visibility"
        />
        <label>Everyone</label>
        <input
          type="radio"
          value="dreps"
          checked={selectedVisibility === 'dreps'}
          onChange={handleChange}
          disabled={!isEnabled}
          name="visibility"
        />
        <label>DReps only</label>
      </div>
    </div>
  );
};

export default PostVisibilityInput;
