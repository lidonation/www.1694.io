import { renderJsonLdValue } from '@/lib';
import { parseURL } from '@/lib/helpers';
import { Typography } from '@mui/material';
import Link from 'next/link';
import React from 'react';
import DatabaseNullIcon from './svgs/DatabaseNullIcon';

type MetadataViewerProps = {
  isMetadataLoading: boolean;
  metadataError: any;
  metadata: any;
  metadataUrl?: string;
};

const MetadataViewer = ({
  isMetadataLoading,
  metadataError,
  metadata,
  metadataUrl,
}: MetadataViewerProps) => {
  const capitalizeFirstLetter = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const hiddenKeys = ['image', 'paymentAddress'];

  const renderContent = () => {
    if (isMetadataLoading) {
      return <p className="animate-pulse text-sm">Loading...</p>;
    }

    if (metadataError) {
      return (
        <div className="mt-3 flex flex-col items-center justify-center">
          <div className="flex w-full flex-col items-center rounded-lg border-2 border-dashed border-gray-300 p-12 hover:border-gray-400">
            <DatabaseNullIcon width={60} height={50} />
            <span className="mt-2 block text-sm font-semibold text-gray-500">
              {metadataError}
            </span>
          </div>
        </div>
      );
    }

    if (!metadata || !metadata.body) {
      return (
        <div className="mt-3 flex flex-col items-center justify-center">
          <div className="flex w-full flex-col items-center rounded-lg border-2 border-dashed border-gray-300 p-12 hover:border-gray-400">
            <DatabaseNullIcon width={60} height={50} />
            <span className="mt-2 block text-sm font-semibold text-gray-500">
              No metadata found
            </span>
          </div>
        </div>
      );
    }

    return Object.entries(metadata.body)
      .filter(([key, value]) => !hiddenKeys.includes(key))
      .map(([key, value]: any[]) => {
        const valueString = renderJsonLdValue(value);
        if (key === 'references') {
          const linksArr = value as any[];
          const links =
            Array.isArray(linksArr) && linksArr.length
              ? linksArr.map((link, index) => {
                  const linkLabel = link?.label?.['@value'] || link?.label;
                  const linkUri = parseURL(link?.uri?.['@value'] || link?.uri);
                  return (
                    <div
                      key={index}
                      className="flex w-full flex-col items-start gap-1 text-sm"
                    >
                      <p className="font-bold ">
                        {capitalizeFirstLetter(linkLabel)}
                      </p>
                      <Link
                        className="w-full break-words font-light"
                        href={linkUri ? linkUri || '#' : '#'}
                        target="_blank"
                      >
                        {linkUri}
                      </Link>
                    </div>
                  );
                })
              : [];
          return (
            <div
              key={key}
              className="flex flex-col items-start justify-center gap-1 text-sm"
            >
              <Typography variant="h6">References</Typography>
              <div className="w-full space-y-1 pl-2">
                {links.length > 0 ? links : 'Empty'}
              </div>
            </div>
          );
        }
        return (
          <div
            key={key}
            className="flex w-full flex-col items-start justify-center gap-1 text-sm"
          >
            <Typography variant="h6">{capitalizeFirstLetter(key)}</Typography>
            <p className="w-full break-words pl-2">{valueString}</p>
          </div>
        );
      });
  };

  return (
    <div className="flex flex-col gap-2">
      {renderContent()}
      {metadataUrl && (
        <Link href={metadataUrl} target="_blank" className="w-fit">
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
