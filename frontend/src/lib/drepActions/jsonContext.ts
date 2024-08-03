export const CIP_100 = 'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#';
export const CIP_108 = 'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0108/README.md#';

export function createDREPContext(metadataKeys: string[]) {
  const bodyContext = metadataKeys.reduce((acc, key) => {
    acc[key] = `CIP100:${key}`;
    return acc;
  }, {} as Record<string, any>);

  if (metadataKeys.includes('references')) {
    bodyContext.references = {
      '@id': 'CIP100:references',
      '@container': '@set' as const,
      '@context': {
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
  }

  return {
    '@language': 'en-us',
    CIP100: 'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#',
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