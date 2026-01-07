import { Box } from '@mui/material';
import React from 'react';
import DRepAvatarCard from '../atoms/DRepAvatarCard';

type DrepLogoProps = {
  drepView: string;
  metadata?: any;
};
function DRepLogo({ drepView, metadata }: DrepLogoProps) {
  return (
    <Box>
      <DRepAvatarCard
        loading={!metadata}
        imageSrc={metadata?.body?.image?.contentUrl}
        showStatusInfo={false}
        size="extraSmall"
        variant="circular"
      />
    </Box>
  );
}

export default DRepLogo;
