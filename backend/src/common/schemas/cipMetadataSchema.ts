import * as Joi from 'joi';
import { MetadataStandard } from '../types';

type StandardSpecification = Record<MetadataStandard, Joi.ObjectSchema<any>>;

const CIP100_URL =
  'https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#';

  // Temporary URL for the CIP-119 metadata
const CIPQQQ_URL =
'https://github.com/cardano-foundation/CIPs/blob/master/CIP-QQQ/README.md#';


export const cipStandardSchema: StandardSpecification = {
  [MetadataStandard.CIP100]: Joi.object({
    '@context': Joi.object({
      '@language': Joi.string().required(),
      CIP100: Joi.string().valid(CIP100_URL).required(),
      CIPQQQ: Joi.string().valid(CIPQQQ_URL).required(),
      hashAlgorithm: Joi.string().valid('CIP100:hashAlgorithm').required(),
      body: Joi.object(),
      authors: Joi.object(),
    }),
    authors: Joi.array(),
    hashAlgorithm: Joi.string().valid('blake2b-256').required(),
    body: Joi.object({
      bio: Joi.string().allow(''),
      dRepName: Joi.string().allow(''),
      email: Joi.string().allow('').required(),
      references: Joi.array()
    }),
  })
};

