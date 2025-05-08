import { useGetDRepMetadataQuery } from '@/hooks/useGetDRepMetadataQuery';
import { Box } from '@mui/material';
import React from 'react';
import DRepAvatarCard from '../atoms/DRepAvatarCard';

type DrepLogoProps = {
  drepView: string;
};
function DRepLogo({ drepView }: DrepLogoProps) {
  const { metadata, isMetadataLoading, metadataError } =
    useGetDRepMetadataQuery(drepView);
  return (
    <Box>
      <DRepAvatarCard
        loading={isMetadataLoading}
        imageSrc={metadata?.body?.image?.contentUrl}
        showStatusInfo={false}
        size="extraSmall"
        variant="circular"
      />
    </Box>
  );
}

export default DRepLogo;
