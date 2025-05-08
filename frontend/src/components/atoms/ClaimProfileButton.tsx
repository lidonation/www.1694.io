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
  size,
  ...buttonProps
}: ClaimProfileButtonProps) => {
  const redirectLink = `/dreps/workflow/profile/new?drep=${drepToBeClaimed}`;
  return (
    <Link href={redirectLink} prefetch={prefetch}>
      <Button
        size={size}
        className="w-full"
        preventDefaultClick={false}
        {...buttonProps}
      >
        {label || 'Claim this profile'}
      </Button>
    </Link>
  );
};
export default ClaimProfileButton;
