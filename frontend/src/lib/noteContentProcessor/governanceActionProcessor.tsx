import React from 'react';
import DrepGovActionSubmitCard from '@/components/atoms/DrepGovActionSubmitCard';

export const governanceActionProcessor = (content: string) => {
  
  const regex = /\[gov_action hash='(.+?)'\]/g;
  const parts: (string | object)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const hash = match[1];
    const startIndex = match.index;
    const endIndex = regex.lastIndex;
  
    parts.push(content.substring(lastIndex, startIndex));

    parts.push(
      <DrepGovActionSubmitCard
        key={hash}
        hash={hash}
      />
    );

    lastIndex = endIndex;
  }

  parts.push(content.substring(lastIndex));

  return parts;
};
