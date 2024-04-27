import { useCardano } from "@/context/walletContext";
import { Input } from "@mui/material";
import React, { useState } from "react";


const PostInput = ({ inputName, id, placeholder,registerValue,errors, dataTestId }) => {
  const { isEnabled } = useCardano();
  return (
    <div className="flex flex-col gap-1">
      <label>{inputName}</label>
      <input
        type="text"
        className={`w-halfScale pl-5 pr-3 py-3 border ${
          !isEnabled && "pointer-events-none"
        }  border-input-border rounded-full`}
        data-testid={dataTestId}
        {...registerValue(id)}
        placeholder={placeholder}
        readOnly={!isEnabled}
      />
      <div className="text-red-700 text-sm" data-testid="error-msg">
        {errors[id] && errors[id].message}
      </div>
    </div>
  )
}

export default PostInput