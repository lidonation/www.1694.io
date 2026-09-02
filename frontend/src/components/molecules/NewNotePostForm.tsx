import React from 'react';
import PostInput from '../atoms/PostInput';
import PostSubmitArea from '../atoms/PostSubmitArea';
import PostVisiblityInput from '../atoms/PostVisiblityInput';
import CustomAutocomplete from '../atoms/PostAutoComplete';
import MarkdownEditor from '../atoms/MarkdownEditor';

const NewNotePostForm = ({
  register,
  control,
  errors,
  isLoading,
  isDisabled,
}) => {
  return (
    <div className="mt-3 flex flex-col gap-3">
      <PostInput
        inputName={'Title'}
        id={'postTitle'}
        placeholder={'Title'}
        registerValue={register}
        errors={errors}
        dataTestId={'post-title-input'}
        isDisabled={isDisabled}
      />
      <CustomAutocomplete
        inputName={'Tags'}
        control={control}
        id={'postTag'}
        placeholder={'Press Enter to add tag'}
        options={[]}
        errors={errors}
        dataTestId={'post-tag-input'}
        isDisabled={isDisabled}
      />
      <MarkdownEditor name="postText" control={control} errors={errors} />
      <PostVisiblityInput
        registerVisibility={register}
        errors={errors}
        isDisabled={isDisabled}
      />
      <PostSubmitArea showViewTimeline={false} isLoading={isLoading} />
    </div>
  );
};

export default NewNotePostForm;
