import Link from 'next/link';
import React from 'react';

const DRepSocialLinks = ({ links }) => {
  const retrieveLink = (link: string) => {
    if (!links) return '#';
    return (
      links.find((ref) => ref.label?.['@value'].includes(link))?.uri?.[
        '@value'
      ] || '#'
    );
  };
  return (
    <div className="flex flex-row gap-2">
      <Link href={retrieveLink('github')}>
        <img className="w-full" src="/svgs/github-dark.svg" alt="" />
      </Link>
      <Link href={retrieveLink('x')}>
        <img className="w-full" src="/svgs/twitter.svg" alt="" />
      </Link>
      <Link href={retrieveLink('facebook')}>
        <img className="w-full" src="/svgs/fb-dark.svg" alt="" />
      </Link>
      <Link href={retrieveLink('instagram')}>
        <img className="w-full" src="/svgs/ig-dark.svg" alt="" />
      </Link>
    </div>
  );
};

export default DRepSocialLinks;
