import { CIP_100_CONTEXT } from '@/constants';
import { CIP_100, CIP_108 } from './drepActions/jsonContext';

type StandardReference = typeof CIP_100 | typeof CIP_108;

type MetadataConfig = {
  data: Record<string, unknown>;
  standardReference: StandardReference;
};

/**
 * Generates the metadata body based on the provided configuration.
 *
 * @param {MetadataConfig} config - The configuration object containing
 * the data and standard reference.
 * @returns {Object} - The generated metadata body.
 */
export const generateMetadataBody = ({
  data,
  standardReference,
}: MetadataConfig) => {
  const filteredData = Object.entries(data).map(
    ([key, value]: [string, any[]]) => {
      const objKey = Object.keys(value)[0];
      const objVal = Object.values(value)[0];
      return [standardReference + objKey, objVal];
    },
  );
  const references = data?.references
    ? // uri should not be optional. It is just not yet supported on drep campaign platform || govtool
      (data.references as Array<{ uri?: string; label: string }>)
        .filter((link) => link.uri)
        .map((link) => ({
          '@type': 'Other',
          [`${CIP_100_CONTEXT}reference-label`]: link.label || 'Label',
          [`${CIP_100_CONTEXT}reference-uri`]: link.uri,
        }))
    : undefined;

  const body = Object.fromEntries(filteredData);

  if (references) {
    body[`${standardReference}references`] = references;
  }

  return body;
};
