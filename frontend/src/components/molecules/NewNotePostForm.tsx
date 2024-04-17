import React from "react";
import PostInput from "../atoms/PostInput";
import TextEditOptions from "./TextEditOptions";
import PostSubmitArea from "../atoms/PostSubmitArea";
import PostTextareaInput from "../atoms/PostTextareaInput";
import PostVisiblityInput from "../atoms/PostVisiblityInput";

const NewNotePostForm = () => {
  return (
    <div>
      <PostInput name={"Note Title"} placeholder={"Note Title"} />
      <PostInput name={"Tags"} placeholder={"Note Tags"} />
      <PostTextareaInput/>
      <PostVisiblityInput/>
      <PostSubmitArea/>
    </div>
  );
};

export default NewNotePostForm;
