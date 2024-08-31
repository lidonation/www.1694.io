import { useCardano } from '@/context/walletContext';
import React, { useState } from 'react';

const PostVisibilityInput = ({ registerVisibility, errors }) => {
  const { isEnabled } = useCardano();
  return (
    <div className="flex flex-col items-start justify-center">
      <p>Set Visibility</p>
      <div className="flex flex-row flex-wrap items-center gap-3">
        <input
          id="everyone"
          type="radio"
          value="everyone"
          disabled={!isEnabled}
          {...registerVisibility('postVisibility')}
          name="postVisibility"
        />
        <label htmlFor="everyone">Everyone</label>
        <input
          id="delegators"
          type="radio"
          value="delegators"
          {...registerVisibility('postVisibility')}
          disabled={!isEnabled}
          name="postVisibility"
        />
        <label htmlFor="delegators">Delegators only</label>
        <input
          id="myself"
          type="radio"
          value="myself"
          {...registerVisibility('postVisibility')}
          disabled={!isEnabled}
          name="postVisibility"
        />
        <label htmlFor="myself">Myself</label>
      </div>
      <div className="text-sm text-red-700" data-testid="error-msg">
        {errors?.postVisibility && errors?.postVisibility?.message}
      </div>
    </div>
  );
};

export default PostVisibilityInput;
