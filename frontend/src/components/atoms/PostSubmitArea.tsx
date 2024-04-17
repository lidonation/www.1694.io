import React from "react";
import Button from "./Button";

const PostSubmitArea = () => {
  return (
    <div className="flex flex-row items-center justify-between w-[75%] mt-5">
      <div className="flex items-center justify-center ml-5">
        <Button variant="text" bgColor="transparent" >
          <p className="text-custom-blue font-semibold" >Save Draft</p>
        </Button>
      </div>
      <div className="flex flex-row gap-2 items-center">
        <Button variant="outlined" bgColor="transparent">
          Cancel
        </Button>
        <Button type="submit">Post in my notes</Button>
      </div>
    </div>
  );
};

export default PostSubmitArea;
