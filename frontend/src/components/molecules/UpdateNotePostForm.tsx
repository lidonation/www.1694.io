import React, { useState } from 'react';
import PostInput from '../atoms/PostInput';
import PostSubmitArea from '../atoms/PostSubmitArea';
import PostTextareaInput from '../atoms/PostTextareaInput';
import PostVisiblityInput from '../atoms/PostVisiblityInput';
import CustomAutocomplete from '../atoms/PostAutoComplete';

const UpdateNotePostForm = ({ register, control, errors}) => {
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
        control={control}
        inputName="Tags"
        id="postTag"
        placeholder="Enter tags"
        options={[]}
        errors={errors}
        dataTestId="tags-input"
      />
      <PostTextareaInput control={control} errors={errors} />
      <PostVisiblityInput registerVisibility={register} errors={errors} />
      <PostSubmitArea />
    </div>
  );
};

export default UpdateNotePostForm;
