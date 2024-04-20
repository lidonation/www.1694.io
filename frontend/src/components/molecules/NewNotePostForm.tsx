import React, { useState } from "react";
import PostInput from "../atoms/PostInput";
import PostSubmitArea from "../atoms/PostSubmitArea";
import PostTextareaInput from "../atoms/PostTextareaInput";
import PostVisiblityInput from "../atoms/PostVisiblityInput";

const NewNotePostForm = ({dataState, setdataState}) => {
  
  return (
    <div>
      <PostInput name={"Note Title"} id={'postTitle'} placeholder={"Note Title"} value={dataState.postTitle} setValue={setdataState} dataTestId={'post-title-input'}/>
      <PostInput name={"Tags"} id={'postTag'} placeholder={"Note Tags"} value={dataState.postTag} setValue={setdataState}  dataTestId={'post-tag-input'}/>
      <PostTextareaInput text={dataState.postText} setText={setdataState}/>
      <PostVisiblityInput visibility={dataState.postVisibity} setVisibility={setdataState}/>
      <PostSubmitArea />
    </div>
  );
};

export default NewNotePostForm;
