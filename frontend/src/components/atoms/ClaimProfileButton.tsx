import Link from 'next/link';
import React from 'react';
import Button, { ButtonProps } from './Button';

interface ClaimProfileButtonProps extends ButtonProps {
  label?: string;
  drepToBeClaimed?: string;
  prefetch?: boolean;
}

const ClaimProfileButton = ({
  label,
  drepToBeClaimed,
  prefetch = false,
  ...buttonProps
}: ClaimProfileButtonProps) => {
  const redirectLink = `/dreps/workflow/profile/new?drep=${drepToBeClaimed}`;
  return (
    <Link className="w-full" href={redirectLink} prefetch={prefetch}>
      <Button className="w-full" {...buttonProps}>
        {label || 'Claim this profile'}
      </Button>
    </Link>
  );
};
export default ClaimProfileButton;
