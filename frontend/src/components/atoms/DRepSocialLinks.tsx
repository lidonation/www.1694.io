import { parseURL } from '@/lib/helpers';
import React from 'react';

const DRepSocialLinks = ({ links }: { links: any[] }) => {
  if (!links || links.length === 0) return null;

  const retrieveLink = (link: string) => {
    const matchingLink = links.find((ref) => {
      const label = (ref.label?.['@value'] || ref?.label || '') as string;
      return label?.toLowerCase()?.includes(link);
    });

    if (matchingLink) {
      const uri = matchingLink.uri?.['@value'] || matchingLink?.uri;
      if (uri && uri !== '' && uri !== '#') {
        try {
          return parseURL(uri);
        } catch (error) {
          console.log(error);
          return uri;
        }
      }
    }
    return null;
  };

  const socialPlatforms = [
    {
      id: 'github',
      icon: '/svgs/github-dark.svg',
      url: retrieveLink('github'),
    },
    {
      id: 'twitter',
      icon: '/svgs/twitter.svg',
      url: retrieveLink('x') || retrieveLink('twitter'),
    },
    {
      id: 'facebook',
      icon: '/svgs/fb-dark.svg',
      url: retrieveLink('facebook'),
    },
    {
      id: 'instagram',
      icon: '/svgs/ig-dark.svg',
      url: retrieveLink('instagram'),
    },
  ];

  const availablePlatforms = socialPlatforms.filter(
    (platform) => platform.url !== null,
  );

  return (
    <div className="flex flex-row gap-2">
      {availablePlatforms.map((platform) => (
        <a
          key={platform.id}
          href={platform.url as string}
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
        >
          <img
            className="h-6 w-6"
            src={platform.icon}
            alt={`${platform.id} link`}
          />
        </a>
      ))}
    </div>
  );
};

export default DRepSocialLinks;
