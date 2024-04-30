import { useCardano } from "@/context/walletContext";
import React, { useState } from "react";

const PostVisibilityInput = ({ registerVisibility, errors }) => {
  const { isEnabled } = useCardano();
  return (
    <div className="flex flex-col items-start justify-center">
      <p>Set Visibility</p>
      <div className="flex flex-row items-center gap-3 ml-3">
        <input
          type="radio"
          value="everyone"
          disabled={!isEnabled}
          {...registerVisibility("postVisibility")}
          name="postVisibility"
        />
        <label>Everyone</label>
        <input
          type="radio"
          value="delegators"
          {...registerVisibility("postVisibility")}
          disabled={!isEnabled}
          name="postVisibility"
        />
        <label>Delegators only</label>
        <input
          type="radio"
          value="myself"
          {...registerVisibility("postVisibility")}
          disabled={!isEnabled}
          name="postVisibility"
        />
        <label>Myself</label>
      </div>
      <div className="text-red-700 text-sm" data-testid="error-msg">
        {errors?.postVisibility && errors?.postVisibility?.message}
      </div>
    </div>
  );
};

export default PostVisibilityInput;
