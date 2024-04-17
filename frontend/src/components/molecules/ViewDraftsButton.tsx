import React from "react";
import Button from "../atoms/Button";

const ViewDraftsButton = () => {
  return (
    <Button
      variant="outlined"
      bgColor="transparent"
      data-testid="view-drafts-button"
    >
      <p className="font-medium">View Drafts</p>
    </Button>
  );
};

export default ViewDraftsButton;
