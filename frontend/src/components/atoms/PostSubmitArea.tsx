import React from "react";
import Button from "./Button";

const PostSubmitArea = () => {
  return (
    <div className="flex flex-row items-center justify-between w-[80%] mt-5">
      <div className="flex items-center justify-center ml-5">
        <Button variant="text" bgColor="transparent">
          <p className="font-medium text-sm text-custom-blue leading-4 text-center">
            Save Draft
          </p>
        </Button>
      </div>
      <div className="flex flex-row gap-2 items-center">
        <Button variant="outlined" bgColor="transparent">
          <p className="font-medium text-sm text-custom-blue leading-4 text-center">
            Cancel
          </p>
        </Button>
        <Button type="submit" data-testid="post-submit-button">
          <p className="font-medium text-sm text-pure-white leading-4 text-center">
            Post in my notes
          </p>
        </Button>
      </div>
    </div>
  );
};

export default PostSubmitArea;
