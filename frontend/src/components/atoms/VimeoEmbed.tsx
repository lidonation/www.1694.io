import React from 'react';

export const VimeoEmbed = ({ videoId }: { videoId: string }) => (
  <div className="my-4 aspect-video">
    <iframe
      style={{ display: 'block', visibility: 'visible' }}
      className="h-full w-full rounded-lg"
      src={`https://player.vimeo.com/video/${videoId}`}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
    />
  </div>
);
