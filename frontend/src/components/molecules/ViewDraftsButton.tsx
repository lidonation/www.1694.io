import React from 'react';
import Button from '../atoms/Button';

const ViewDraftsButton = () => {
  return (
    <Button
      variant="outlined"
      bgColor="transparent"
      data-testid="view-drafts-button"
      borderRadius="2.6875rem"
      width={'8.6875rem'}
      size="extraLarge"
    >
      <p className="text-center text-sm font-medium leading-4 text-blue-800">
        View Drafts
      </p>
    </Button>
  );
};

export default ViewDraftsButton;
