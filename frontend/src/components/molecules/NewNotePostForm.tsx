import React from 'react';
import PostInput from '../atoms/PostInput';
import PostSubmitArea from '../atoms/PostSubmitArea';
import PostTextareaInput from '../atoms/PostTextareaInput';
import PostVisiblityInput from '../atoms/PostVisiblityInput';
import { Autocomplete, Chip, TextField } from '@mui/material';
import CustomAutocomplete from '../atoms/PostAutoComplete';

const NewNotePostForm = ({ register, control, errors }) => {
  return (
    <div className="mt-3 flex flex-col gap-3">
      <PostInput
        inputName={'Note Title'}
        id={'postTitle'}
        placeholder={'Note Title'}
        registerValue={register}
        errors={errors}
        dataTestId={'post-title-input'}
      />
      <CustomAutocomplete
        inputName={'Tags'}
        control={control}
        id={'postTag'}
        placeholder={'Press Enter to add tag'}
        options={[]}
        errors={errors}
        dataTestId={'post-tag-input'}
      />
      <PostTextareaInput control={control} errors={errors} />
      <PostVisiblityInput registerVisibility={register} errors={errors} />
      <PostSubmitArea />
    </div>
  );
};

export default NewNotePostForm;
