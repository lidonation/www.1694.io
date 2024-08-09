export const CIP_100 =
  'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#';
export const CIP_108 =
  'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0108/README.md#';
export const CIP_QQQ =
  'https://github.com/cardano-foundation/CIPs/blob/master/CIP-QQQ/README.md#';

export function createDREPContext(metadataKeys: string[]) {
  const bodyContext = metadataKeys.reduce(
    (acc, key) => {
      acc[key] = `CIPQQQ:${key}`;
      return acc;
    },
    {} as Record<string, any>,
  );

  bodyContext.references = {
    '@id': 'CIPQQQ:references',
    '@container': '@set',
    '@context': {
      GovernanceMetadata: 'CIP100:GovernanceMetadataReference',
      Other: 'CIP100:OtherReference',
      label: 'CIP100:reference-label',
      uri: 'CIP100:reference-uri',
      referenceHash: {
        '@id': 'CIPQQQ:referenceHash',
        '@context': {
          hashDigest: 'CIPQQQ:hashDigest',
          hashAlgorithm: 'CIP100:hashAlgorithm',
        },
      },
    },
  };

  return {
    '@language': 'en-us',
    CIP100:
      'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#',
    CIPQQQ: CIP_QQQ,
    hashAlgorithm: 'CIP100:hashAlgorithm',
    body: {
      '@id': 'CIPQQQ:body',
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
