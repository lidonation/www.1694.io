import { Typography } from '@mui/material';
import Link from 'next/link';
import React from 'react';
export const renderJsonldValue = (value: any) => {
  if (typeof value === 'object') {
    return value['@value'] ? value['@value'] : 'Empty';
  }
  return JSON.stringify(value);
};
const MetadataViewer = ({
  isMetadataLoading,
  metadataError,
  metadata,
  metadataUrl,
}: {
  isMetadataLoading: boolean;
  metadataError: any;
  metadata: any;
  metadataUrl?: string;
}) => {
  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const renderContent = () => {
    if (isMetadataLoading) {
      return <p className="text-sm">Loading...</p>;
    }

    if (metadataError) {
      return <p className="text-sm">{metadataError}</p>;
    }

    if (!metadata || !metadata.body) {
      return <p className="text-sm">No metadata found</p>;
    }

    return Object.entries(metadata.body).map(([key, value]: any[]) => {
      const valueString = renderJsonldValue(value);
      if (key === 'references') {
        const linksArr = value as any[];
        const links = linksArr.map((link, index) => {
          return (
            <div key={index} className="flex items-center gap-1 text-sm">
              <p className="font-semibold">{link?.label?.['@value']}</p>
              <span className="mx-2 flex-grow border-t border-dotted border-gray-400"></span>
              <Link
                href={
                  link?.uri?.['@value'] ? link?.uri?.['@value'] || '#' : '#'
                }
                target="_blank"
              >
                {link?.uri?.['@value']}
              </Link>
            </div>
          );
        });
        return (
          <div
            key={key}
            className="flex flex-col items-start justify-center gap-1 text-sm"
          >
            <Typography variant="h6">References</Typography>
            <div className="pl-2">{links.length > 0 ? links : 'Empty'}</div>
          </div>
        );
      }
      return (
        <div
          key={key}
          className="flex flex-col items-start justify-center gap-1 text-sm"
        >
          <Typography variant="h6">{capitalizeFirstLetter(key)}</Typography>
          <p className="pl-2">{valueString}</p>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {renderContent()}
      {metadataUrl && (
        <Link href={metadataUrl} target="_blank">
          <div className="flex items-center gap-1 text-sm">
            <p className="font-semibold text-gray-600 hover:text-gray-800">
              View External Link
            </p>
            <img src="/svgs/external-link.svg" alt="" />
          </div>
        </Link>
      )}
    </div>
  );
};

export default MetadataViewer;
