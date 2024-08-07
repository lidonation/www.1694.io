import React from 'react';

const MetadataViewer = ({ isMetadataLoading, metadataError, metadata, metadataUrl }: { isMetadataLoading: boolean, metadataError: any, metadata: any, metadataUrl: string }) => {

  const renderValue = (value: any) => {
    if (typeof value === 'object' && value['@value']) {
      return value['@value'];
    }
    return JSON.stringify(value);
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const renderContent = () => {
    if (isMetadataLoading) {
      return  <p className='text-sm'>Loading...</p>;
    }

    if (metadataError) {
      return <p className='text-sm'>{metadataError + '\n' + metadataUrl}</p>;
    }

    if (!metadata || !metadata.body) {
      return <p className='text-sm'>No metadata found</p>;
    }

    return Object.entries(metadata.body).map(([key, value]: any[]) => {
      const valueString = renderValue(value);
      return (
        <p key={key}>
          {capitalizeFirstLetter(key)}: {valueString}
        </p>
      );
    });
  };

  return <div>{ renderContent() }</div>;
};

export default MetadataViewer;
