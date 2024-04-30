import React from "react";
import Button from "../atoms/Button";

const ViewDraftsButton = () => {
  return (
    <Button
      variant="outlined"
      bgColor="transparent"
      data-testid="view-drafts-button"
      borderRadius="43px"
      width={'139px'}
      size="extraLarge"
    >
      <p className="font-medium text-sm text-blue-800 leading-4 text-center">View Drafts</p>
    </Button>
  );
};

export default ViewDraftsButton;
