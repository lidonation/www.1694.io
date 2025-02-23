export const CIP_100 =
  'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#';

export function createDRepVoteContext(metadataKeys: string[]) {
  const specialKeys = ['references', 'externalUpdates'];
  const bodyContext = metadataKeys
    .filter((key) => !specialKeys.includes(key))
    .reduce(
      (acc, key) => {
        acc[key] = `CIP100:${key}`;
        return acc;
      },
      {} as Record<string, any>,
    );
  bodyContext.externalUpdates = {
    '@id': 'CIP100:externalUpdates',
    '@context': {
      title: 'CIP100:update-title',
      uri: 'CIP100:uri',
    },
  };
  bodyContext.references = {
    '@id': 'CIP100:references',
    '@container': '@set',
    '@context': {
      GovernanceMetadata: 'CIP100:GovernanceMetadataReference',
      Other: 'CIP100:OtherReference',
      label: 'CIP100:reference-label',
      uri: 'CIP100:reference-uri',
      referenceHash: {
        '@id': 'CIP100:referenceHash',
        '@context': {
          hashDigest: 'CIP100:hashDigest',
          hashAlgorithm: 'CIP100:hashAlgorithm',
        },
      },
    },
  };
  return {
    '@language': 'en-us',
    CIP100:
      'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#',
    hashAlgorithm: 'CIP100:hashAlgorithm',
    body: {
      '@id': 'CIP100:body',
      '@context': bodyContext,
    },
    authors: {
      '@id': 'CIP100:authors',
      '@container': '@set' as const,
      '@context': {
        name: 'http://xmlns.com/foaf/0.1/name',
        witness: {
          '@id': 'CIP100:witness',
          '@context': {
            witnessAlgorithm: 'CIP100:witnessAlgorithm',
            publicKey: 'CIP100:publicKey',
            signature: 'CIP100:signature',
          },
        },
      },
    },
  };
}
