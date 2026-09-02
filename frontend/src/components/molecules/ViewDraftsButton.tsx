import React from 'react';
import Button from '../atoms/Button';

const ViewDraftsButton = ({ isUpdating = false }: { isUpdating?: boolean }) => {
  return (
    <Button
      variant="outlined"
      bgcolor="transparent"
      data-testid="view-drafts-button"
      borderRadius="2.6875rem"
      width={'8.6875rem'}
      size="extraLarge"
      disabled={!isUpdating}
    >
      <p className="text-center text-sm leading-4 font-medium text-blue-800">
        My Notes
      </p>
    </Button>
  );
};

export default ViewDraftsButton;
