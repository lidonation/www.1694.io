import { CIP_100_CONTEXT, urls } from '@/constants';
import {
  CIP_100,
  CIP_108,
  CIP_QQQ,
  createDREPContext,
} from './drepActions/jsonContext';
import { generateJsonld } from './generateJSONLD';
import { blake2bHex } from 'blakejs';
import { getExternalMetadata } from '@/services/requests/postExternalMetadataUrl';
import { v4 as uuidv4 } from 'uuid';
type StandardReference = typeof CIP_100 | typeof CIP_108 | typeof CIP_QQQ;

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
  const filteredData = Object.entries(data).map(([key, value]) => [
    standardReference + key,
    value,
  ]);
  //Unable to replicate govtool schema validation
  // const references = data?.references
  //   ? // uri should not be optional. It is just not yet supported on drep campaign platform || govtool
  //     (data.references as Array<{ uri?: string; label: string }>)
  //       .filter((link) => link.uri)
  //       .map((link) => ({
  //         '@type': 'Other',
  //         [`${CIP_100_CONTEXT}reference-label`]: link.label || 'Label',
  //         [`${CIP_100_CONTEXT}reference-uri`]: link.uri,
  //       }))
  //   : undefined;

  const body = Object.fromEntries(filteredData);

  if (data?.references) {
    body[`${standardReference}references`] = data?.references;
  }

  return body;
};

export const processExternalMetadata = async ({ metadataUrl }) => {
  const res = await getExternalMetadata({
    metadataUrl,
  });
  const jsonLdData = res;
  const renderValue = (value: any) => {
    if (typeof value === 'object' && value['@value']) {
      return value['@value'];
    }
    return JSON.stringify(value);
  };
  const modifiedJson = Object.entries(jsonLdData.body).map(
    ([key, value]: any[]) => {
      const valueString = renderValue(value);
      return { id: uuidv4(), key: key, value: valueString };
    },
  );
  return {
    jsonLdData,
    modifiedJson,
  };
};
export const submitMetadata = async (
  metadataKeys: string[],
  data: any[],
  loginSignTransaction: () => Promise<any>,
  vkeys?: any,
) => {
  try {
    let currentVKeys = vkeys;
    const dynamicDREPContext = createDREPContext(metadataKeys);
    const jsonLdData = await generateMetadataBody({
      data: data as any,
      standardReference: CIP_QQQ,
    });
    // sign metadata tx
    if (!currentVKeys) {
      const { signature, key: vkey } = await loginSignTransaction();
      const vkeys = {
        vkey,
        signature,
      };
      currentVKeys = vkeys;
    }
    const jsonld = await generateJsonld(
      jsonLdData,
      JSON.parse(data['references']),
      dynamicDREPContext,
      CIP_QQQ,
      currentVKeys
    );
    //hasing the raw kay value pairs to be validated
    const jsonHash = blake2bHex(JSON.stringify(jsonld), undefined, 32);

    return {
      jsonHash,
      jsonld,
    };
  } catch (error) {
    console.error(error);
    throw new Error(error);
  }
};
