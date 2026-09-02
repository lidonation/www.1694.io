import React from 'react';

const PostInput = ({
  inputName,
  id,
  placeholder,
  registerValue,
  errors,
  dataTestId,
  isDisabled,
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label>{inputName}</label>
      <input
        type="text"
        className={`border py-3 pr-3 pl-5 ${
          isDisabled && 'pointer-events-none'
        } rounded-full border-zinc-100`}
        data-testid={dataTestId}
        {...registerValue(id)}
        placeholder={placeholder}
        readOnly={isDisabled}
      />
      <div className="text-sm text-red-500" data-testid="error-msg">
        <span>{errors[id] && errors[id].message}</span>
      </div>
    </div>
  );
};

export default PostInput;
