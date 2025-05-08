import React, { useEffect, useState, useRef } from 'react';
import { Avatar, Box, Skeleton, Typography } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import axiosInstance from '@/services/axiosInstance';

interface DRepAvatarCardProps {
  loading: boolean;
  imageSrc: string;
  showStatusInfo?: boolean;
  size?: 'extraSmall' | 'small' | 'medium' | 'large';
  variant?: 'circular' | 'rounded' | 'square';
}

const DRepAvatarCard: React.FC<DRepAvatarCardProps> = ({
  loading,
  imageSrc,
  showStatusInfo = true,
  size = 'small',
  variant = 'circular',
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      if (!imageSrc) return;

      setIsImageLoading(true);
      setError(null);

      cancelTokenRef.current = axios.CancelToken.source();

      try {
        const response = await axiosInstance.get('/dreps/media', {
          params: {
            assetUrl: imageSrc,
          },
          responseType: 'blob',
          cancelToken: cancelTokenRef.current.token,
        });

        const imageObjectUrl = URL.createObjectURL(response.data);
        setImageUrl(imageObjectUrl);
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request canceled:', error.message);
        } else if (error.code === 'ECONNABORTED') {
          setError('Image loading timed out. Please try again.');
        } else if (error?.response?.status === 500) {
          setError('Server error occurred while loading image.');
        } else {
          console.error('Error fetching image:', error);
          setError('Failed to load image');
        }
      } finally {
        setIsImageLoading(false);
      }
    };

    fetchImage();

    return () => {
      if (cancelTokenRef.current) {
        cancelTokenRef.current.cancel('Component unmounted');
      }
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
      setImageUrl(null);
      setError(null);
    };
  }, [imageSrc]);

  const sizeMap = {
    extraSmall: '2rem',
    small: '4rem',
    medium: '8rem',
    large: '14rem',
  };

  return (
    <Box className="flex flex-col">
      <Avatar
        variant={variant}
        className={`${!imageUrl && (loading || isImageLoading) ? 'animate-pulse bg-gray-300' : ''}`}
        src={imageUrl || undefined}
        sx={{
          width: sizeMap[size],
          height: sizeMap[size],
        }}
        alt="DRep Avatar"
      />
      {showStatusInfo && error && (
        <Typography variant="caption" className="mt-2 text-red-500">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default DRepAvatarCard;
