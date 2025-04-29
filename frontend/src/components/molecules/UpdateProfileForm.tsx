import React from 'react';
import PostInput from '../atoms/PostInput';
import ProfileSubmitArea from '../atoms/ProfileSubmitArea';
import ProfileUploadCard from '../atoms/ProfileUploadCard';
import TextAreaInput from '../atoms/TextAreaInput';
interface UpdateProfileFormProps {
  register: any;
  control: any;
  errors: any;
  setProfileUrl: any;
  currentProfileUrl?: string;
  isDisabled?: boolean;
}

const UpdateProfileForm = ({
  register,
  control,
  errors,
  setProfileUrl,
  currentProfileUrl,
  isDisabled,
}: UpdateProfileFormProps) => {
  const isUpdate = true;
  return (
    <div className="mt-3 flex flex-col gap-3">
      <PostInput
        inputName={'Name'}
        id={'profileName'}
        placeholder={'Name'}
        registerValue={register}
        errors={errors}
        dataTestId={'profile-name-input'}
        isDisabled={isDisabled}
      />
      <PostInput
        inputName={'Bio'}
        id={'profileBio'}
        placeholder={'Bio'}
        registerValue={register}
        errors={errors}
        dataTestId={'profile-bio-input'}
        isDisabled={isDisabled}
      />
      <PostInput
        inputName={'Email'}
        id={'profileEmail'}
        placeholder={'Email'}
        registerValue={register}
        errors={errors}
        dataTestId={'profile-email-input'}
        isDisabled={isDisabled}
      />
      <PostInput
        inputName={'Payment address'}
        id={'paymentAddress'}
        placeholder={'An address for payments'}
        registerValue={register}
        errors={errors}
        dataTestId={'payment-address-input'}
        isDisabled={isDisabled}
      />
      <TextAreaInput
        inputName={'Objectives'}
        id={'objectives'}
        placeholder={'Your objectives'}
        registerValue={register}
        errors={errors}
        dataTestId={'objective-input'}
        isDisabled={isDisabled}
      />
      <TextAreaInput
        inputName={'Qualifications'}
        id={'qualifications'}
        placeholder={'Your qualifications'}
        registerValue={register}
        errors={errors}
        dataTestId={'qualification-input'}
        isDisabled={isDisabled}
      />
      <TextAreaInput
        inputName={'Motivations'}
        id={'motivations'}
        placeholder={'Your motivations'}
        registerValue={register}
        errors={errors}
        dataTestId={'motivation-input'}
        isDisabled={isDisabled}
      />
      <ProfileUploadCard
        registerUrl={register}
        control={control}
        setProfileUrl={setProfileUrl}
        isUpdate={isUpdate}
        currentProfileUrl={currentProfileUrl}
      />
      <ProfileSubmitArea isUpdate={isUpdate} />
    </div>
  );
};

export default UpdateProfileForm;
