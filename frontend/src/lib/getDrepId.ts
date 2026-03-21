import * as blake from 'blakejs';
import { bech32 } from 'bech32';
import { CardanoApiWallet } from '@/models/wallet';
import { dRepPhraseProcessor } from './utils';

export const formHexToBech32 = (dRepID?: string) => {
  if (!dRepID) return;
  const words = bech32.toWords(Buffer.from(dRepID, 'hex'));
  return bech32.encode('drep', words);
};

// New function to convert from bech32 to hex
export const fromBech32ToHex = (dRepIDBech32: string): string => {
  try {
    const decoded = bech32.decode(dRepIDBech32);
    const data = bech32.fromWords(decoded.words);
    return Buffer.from(data).toString('hex');
  } catch (error) {
    console.error('Error decoding bech32:', error);
    return '';
  }
};

export const getPubDRepID = async (walletApi: CardanoApiWallet) => {
  try {
    // From wallet get pub DRep key
    const dRepKey = await walletApi.cip95.getPubDRepKey();

    // From wallet's DRep key hash to get DRep ID
    const dRepKeyBytes = Buffer.from(dRepKey, 'hex');
    const dRepID = blake.blake2bHex(dRepKeyBytes as any, undefined, 28);

    // into bech32
    const dRepIDBech32 = formHexToBech32(dRepID);

    return {
      dRepKey,
      dRepID,
      dRepIDBech32,
    };
  } catch (err) {
    console.error('Error in getPubDRepID:', err);
    return {
      dRepKey: undefined,
      dRepID: undefined,
      dRepIDBech32: undefined,
    };
  }
};

export const compareDRepIDs = (dRepID1: string, dRepID2: string) => {
  if (!dRepID1 || !dRepID2) return false;
  //first make them one
  const drep1Hex = dRepPhraseProcessor(dRepID1);
  const drep2Hex = dRepPhraseProcessor(dRepID2);
  return drep1Hex == drep2Hex;
};

export const isCip105 = (dRepID: string) => {
  if (!dRepID) return false;
  return dRepID.length === 56;
};
