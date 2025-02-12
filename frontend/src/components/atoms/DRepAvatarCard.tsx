import React, { useEffect, useState, useRef } from 'react';
import { Avatar, Skeleton, Typography } from '@mui/material';
import axios, { CancelTokenSource } from 'axios';
import axiosInstance from '@/services/axiosInstance';

interface DRepAvatarCardProps {
  loading: boolean;
  imageSrc: string;
}

const DRepAvatarCard: React.FC<DRepAvatarCardProps> = ({ loading, imageSrc }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelTokenRef = useRef<CancelTokenSource | null>(null);

  useEffect(() => {
    const fetchImage = async () => {
      if (!imageSrc) return;

      setIsLoading(true);
      setError(null);

      // Create a cancel token source
      cancelTokenRef.current = axios.CancelToken.source();

      try {
        // Use axiosInstance with the cancel token
        const response = await axiosInstance.get('/dreps/media', {
          params: {
            assetUrl: imageSrc
          },
          responseType: 'blob',
          cancelToken: cancelTokenRef.current.token
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
        setIsLoading(false);
      }
    };

    fetchImage();

    // Cleanup function
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center">
        <Skeleton
          animation="wave"
          variant="circular"
          width={200}
          height={200}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <Avatar
        variant="rounded"
        className="w-full"
        src={imageUrl || undefined}
        sx={{
          width: '100%',
          height: '100%',
        }}
      />
      {isLoading && (
        <Typography
          variant="caption"
          className="mt-2 animate-pulse text-gray-500"
        >
          Loading image...
        </Typography>
      )}
      {error && (
        <Typography variant="caption" className="mt-2 text-red-500">
          {error}
        </Typography>
      )}
    </div>
  );
};

export default DRepAvatarCard;