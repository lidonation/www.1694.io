'use client';
import React, { useEffect, useState } from 'react';
import Button from './Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DotsLoader from './DotsLoader';
import { useWallet } from '@/context/globalContext';

type PostSubmitAreaProps = {
  isUpdating?: boolean;
  showViewTimeline?: boolean;
  isLoading?: boolean;
  noteCreatedAt?: string;
  isDisabled?: boolean;
};

const PostSubmitArea = ({
  isUpdating = false,
  showViewTimeline = true,
  isLoading,
  noteCreatedAt,
  isDisabled,
}: PostSubmitAreaProps) => {
  const {
    wallet: { dRepIdBech32 },
  } = useWallet();
  const [bgColor, setBgColor] = useState('transparent');
  const TEN_MINUTES = 10 * 60 * 1000;

  const router = useRouter();

  const isRecentlyCreated =
    new Date().getTime() - new Date(noteCreatedAt).getTime() <= TEN_MINUTES;

  useEffect(() => {
    if (isRecentlyCreated) {
      let toggle = false;
      const interval = setInterval(() => {
        toggle = !toggle;
        setBgColor(toggle ? '#f5d0fe' : 'transparent');
      }, 500);

      const stopTimer = setTimeout(() => {
        clearInterval(interval);
        setBgColor('transparent');
      }, 2000);

      return () => {
        clearInterval(interval);
        clearTimeout(stopTimer);
      };
    }
  }, [isRecentlyCreated]);

  const handleCancel = () => {
    router.back();
  };

  return (
    <div
      className={`flex w-full flex-row items-center ${!!showViewTimeline ? 'justify-between' : 'justify-end'}`}
    >
      {showViewTimeline && (
        <Button
          variant="text"
          bgcolor={bgColor}
          sx={isDisabled ? { pointerEvents: 'none' } : {}}
          disabled={!isUpdating}
          className="transition-all duration-3000 ease-linear"
        >
          <Link
            href={`/dreps/${dRepIdBech32}/timeline`}
            prefetch={true}
            className="text-center text-sm leading-4 font-medium text-blue-800"
          >
            View In Timeline
          </Link>
        </Button>
      )}

      <div className="flex flex-row items-center gap-2">
        <Button
          variant="outlined"
          bgcolor="transparent"
          handleClick={handleCancel}
          sx={isDisabled ? { pointerEvents: 'none' } : {}}
        >
          <p className="text-center text-sm leading-4 font-medium text-blue-800">
            Cancel
          </p>
        </Button>
        <Button
          type="submit"
          data-testid="post-submit-button"
          sx={isDisabled ? { pointerEvents: 'none' } : {}}
          className="flex items-center gap-2"
        >
          {!isLoading && (
            <p className="text-center text-sm leading-4 font-medium text-white">
              Post
            </p>
          )}
          {isLoading && (
            <div className="mx-auto transition-all duration-300 ease-linear">
              <DotsLoader size={10} shadowOffset={12} />
            </div>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PostSubmitArea;
