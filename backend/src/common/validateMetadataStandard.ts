import { Logger } from '@nestjs/common';
import { LoggerMessage, MetadataStandard, MetadataValidationStatus } from './types';
import { cipStandardSchema } from './schemas/cipMetadataSchema';

export const validateMetadataStandard = async (
  data: Record<string, unknown>,
  standard: MetadataStandard,
) => {
  try {
    await cipStandardSchema[standard]?.validateAsync(data);
  } catch (error) {
    Logger.error(LoggerMessage.METADATA_VALIDATION_ERROR, error);
    throw MetadataValidationStatus.INCORRECT_FORMAT;
  }
};
