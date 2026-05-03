'use client';
import React from 'react';
import { Autocomplete, Chip, TextField } from '@mui/material';
import { Controller } from 'react-hook-form';

const CustomAutocomplete = ({
  control,
  inputName,
  id,
  placeholder,
  options,
  errors,
  dataTestId,
  isDisabled,
}) => {

  return (
    <div className="flex flex-col gap-1">
      <label>{inputName}</label>
      <Controller
        name={id}
        control={control}
        render={({ field }) => (
          <Autocomplete
            multiple
            id={id}
            options={options}
            freeSolo
            value={field.value || []}
            onChange={(event, newValue) => field.onChange(newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    variant="outlined"
                    label={option}
                    key={key}
                    {...tagProps}
                  />
                );
              })
            }
            readOnly={isDisabled}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                className={`border ${
                  isDisabled && 'pointer-events-none'
                }  rounded-full border-zinc-100 bg-white`}
                data-testid={dataTestId}
                placeholder={placeholder}
              />
            )}
            disabled={isDisabled}
          />
        )}
      />
      <div className="text-sm text-red-500" data-testid="error-msg">
        <span>{errors[id] && errors[id].message}</span>
      </div>
    </div>
  );
};

export default CustomAutocomplete;
