// utils.js
// This file is designed to house small, reusable utility functions that serve as building blocks for constructing more complex functionalities within the application.
// It includes a range of generic helpers for tasks like data manipulation, formatting, and validation.
// Additionally, this file may contain functions for testing purposes, providing a toolkit for verifying the correctness and efficiency of larger functions.
// By centralizing these utilities, we promote a modular and maintainable codebase, facilitating ease of development and testing.

import { bech32 } from 'bech32';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import { formHexToBech32, fromBech32ToHex, isCip105 } from './getDrepId';
import getEpochParams from '@/services/requests/getEpochParams';
import { setItemToLocalStorage } from './localStorage';
import { checkTxExists } from '@/services/requests/checkTxExists';
import { Address } from '@emurgo/cardano-serialization-lib-asmjs';

export const sumTestExample = (a, b) => {
  return a + b;
};

export function convertString(inputString: string, isMobile?: boolean) {
  if (typeof inputString === 'undefined' || inputString?.length <= 10) {
    return inputString; // If the string is too short, no replacement is needed
  }
  //the string will be truncated per mobile width
  if (isMobile) {
    return inputString.slice(0, 5) + '.......' + inputString.slice(-5);
  }

  return inputString.slice(0, 10) + '.......' + inputString.slice(-10);
}

export function decodeToken(token: string) {
  const decoded = jwtDecode<JwtPayload>(token);
  let isExpired = false;
  const { exp } = decoded;
  //check if expired
  if (exp < Date.now() / 1000) isExpired = true;
  return { decoded, isExpired };
}

export function shortenAddress(address: string, length: number) {
  // get [length] characters from the start and end of the address
  return address.slice(0, length) + '...' + address.slice(-length);
}

export function shortNumber(value: number, decimals: number = 0) {
  // nine Zeroes for Billions
  return Math.abs(Number(value)) >= 1.0e9
    ? (Math.abs(Number(value)) / 1.0e9).toFixed(decimals) + 'B'
    : // six Zeroes for Millions
      Math.abs(Number(value)) >= 1.0e6
      ? (Math.abs(Number(value)) / 1.0e6).toFixed(decimals) + 'M'
      : // three Zeroes for Thousands
        Math.abs(Number(value)) >= 1.0e3
        ? (Math.abs(Number(value)) / 1.0e3).toFixed(decimals) + 'K'
        : Math.abs(Number(value));
}

export function lovelaceToAda(lovelace: number) {
  // convert lovelace to ada, assuming 1 lovelace = 1000000 ada
  const divisibility = 1000000;
  return Number(lovelace) / divisibility;
}

export function formattedAda(lovelace: number | string, decimals: number) {
  let numberLovelace = Number(lovelace);
  let ada = lovelaceToAda(numberLovelace);
  return shortNumber(ada, decimals);
}

export function formatAsCurrency(amount: number | string) {
  let numberAmount = Number(amount);
  return numberAmount.toLocaleString('en-US');
}

export const handleCopyText = (
  text: string,
  addSuccessAlert?: (message: string) => void,
) => {
  navigator.clipboard.writeText(text).then(() => {
    if (addSuccessAlert) {
      addSuccessAlert('Copied!');
    }
  });
};

export const formatNumberTimeToReadable = (time: number) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  const startTimeFormatted = new Date(time).toLocaleString(undefined, options);
  return startTimeFormatted;
};

export const formatDateTimeToUTC = (timestamp: number): string => {
  const date = new Date(timestamp);
  const day = date.getUTCDate().toString().padStart(2, '0');
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const year = date.getUTCFullYear();

  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  const amPm = hours >= 12 ? 'PM' : 'AM';

  const hours12 = hours % 12 || 12;

  return `${day}/${month}/${year} - ${hours12}:${minutes} ${amPm} UTC`;
};

export const toBase64 = (file) => {
  if (!file) return;
  if (typeof file === 'string') return file;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export async function sha256(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function percentageDifference(
  newNumber: number,
  oldNumber: number,
  fixed = 2,
) {
  const percent = ((newNumber - oldNumber) / oldNumber) * 100;
  if (!isNaN(percent)) {
    return Number(percent.toFixed(fixed));
  }

  return null;
}

export const renderJsonLdValue = (value: any) => {
  if (typeof value === 'object') {
    return value['@value'] ? value['@value'] : 'Empty';
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
};

export const checkStatus = (active: boolean) => {
  return !!active ? 'Active' : 'Inactive';
};

export const convertHexToCIP129 = (isScripted: boolean, hexPhrase: string) => {
  if (hexPhrase?.startsWith('drep_always')) {
    return hexPhrase;
  }
  return encodeCIP129Identifier({
    txID: `${isScripted ? '23' : '22'}${hexPhrase}`,
    bech32Prefix: isScripted ? 'drep_script' : 'drep',
  });
};

export const convertDrepPhraseToCIP105 = (phrase: string) => {
  if (phrase.startsWith('drep_always')) {
    return phrase;
  }
  const hex = dRepPhraseProcessor(phrase);
  return formHexToBech32(hex);
};

export const convertDrepPhraseToCIP105Legacy = (phrase: string) => {
  if (phrase.startsWith('drep_always')) {
    return phrase;
  }
  const hex = dRepPhraseProcessorLegacy(phrase);
  return formHexToBech32(hex);
};

//TODO: update this wrong function
/**
 * Processes the search phrase for dRep and returns the dRep ID.
 * If the phrase starts with "drep_script" or "drep",
 * it decodes the CIP129 identifier and extracts the transaction ID.
 * If the DRep ID starts with "22" or "23", it returns the ID without the prefix.
 * If any error occurs during processing, it returns the original phrase.
 *
 * @param phrase - The search phrase to be processed.
 * @returns The dRep ID extracted from the search phrase or the original phrase if an error occurs.
 */
export const dRepPhraseProcessor = (phrase: string) => {
  let drepIDPhrase = phrase;

  try {
    if (
      drepIDPhrase.startsWith('drep_script') ||
      drepIDPhrase.startsWith('drep')
    ) {
      const { txID } = decodeCIP129Identifier(drepIDPhrase);

      drepIDPhrase = txID;
    }
    if (drepIDPhrase.length === 58) {
      return drepIDPhrase.slice(2);
    }

    return drepIDPhrase;
  } catch (e) {
    return phrase;
  }
};

export const dRepPhraseProcessorLegacy = (phrase: string) => {
  let drepIDPhrase = phrase;

  try {
    if (
      drepIDPhrase.startsWith('drep_script') ||
      drepIDPhrase.startsWith('drep')
    ) {
      //check if its already cip-105
      if (isCip105(drepIDPhrase)) {
        return fromBech32ToHex(drepIDPhrase);
      }
      const { txID } = decodeCIP129Identifier(drepIDPhrase);

      drepIDPhrase = txID;
    }
    if (drepIDPhrase.length === 58) {
      return drepIDPhrase.slice(2);
    }

    return drepIDPhrase;
  } catch (e) {
    return phrase;
  }
};

/**
 * Encodes a CIP129 identifier based on the provided transaction ID, index, and bech32 prefix.
 * @param txID - The transaction ID.
 * @param index - The index.
 * @param bech32Prefix - The bech32 prefix.
 * @returns The generated CIP129 identifier.
 */
export const encodeCIP129Identifier = ({
  txID,
  index,
  bech32Prefix,
}: {
  txID: string;
  index?: string;
  bech32Prefix: string;
}) => {
  const govActionBytes = Buffer.from(index ? txID + index : txID, 'hex');
  const words = bech32.toWords(govActionBytes);
  return bech32.encode(bech32Prefix, words);
};

/**
 * Decodes a CIP129 identifier.
 * @param cip129Identifier - The CIP129 identifier to decode.
 * @returns An object containing the decoded transaction ID, index, and prefix.
 */
export const decodeCIP129Identifier = (cip129Identifier: string) => {
  const { prefix, words } = bech32.decode(cip129Identifier);
  const buffer = Buffer.from(bech32.fromWords(words));
  const txID = buffer.subarray(0, 32).toString('hex');
  const index = buffer.subarray(32).toString('hex');
  return { txID, index, prefix };
};

export const parseContent = (content: string): string => {
  if (!content) {
    return '';
  }
  return content
    .replace(/\r\n/g, '<br/>')
    .replace(/\n/g, '<br/>')
    .replace(/\r/g, '<br/>');
};

export const utf8ToHex = (str) => {
  return Array.from(str)
    .map((char: any) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
};

export const saveDataInSession = (key: string, value: string) => {
  const data = { value, timestamp: new Date().getTime() };
  sessionStorage.setItem(key, JSON.stringify(data));
};

export const getDataFromSession = (key: string) => {
  const data = JSON.parse(sessionStorage.getItem(key));
  if (data) {
    return data.value;
  } else {
    return null;
  }
};

export const deleteDataFromSession = (key: string) => {
  sessionStorage.removeItem(key);
};

export const openInNewTab = (url) => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (newWindow) newWindow.opener = null;
};

export const scrollToElement = (e: any, elementId: string) => {
  e.preventDefault();
  const element = document.getElementById(elementId);

  if (element) {
    const rect = element.getBoundingClientRect();
    const offsetPosition = window.pageYOffset + rect.top - 40;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }
};

export const setEpochParams = async () => {
  try {
    const protocol = await getEpochParams();
    setItemToLocalStorage('protocolParams', protocol);
    return protocol;
  } catch (err) {
    console.log(err);
  }
};

export const pollTransaction = async (txHash: string) => {
  const maxAttempts = 30; // 5 minutes total
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const isTxAvailable = await checkTxExists(txHash);
      if (isTxAvailable) {
        return true;
      }
    } catch (error) {
      console.error('Polling error:', error);
    } finally {
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
  return false;
};

export function decodeJWT(jwt?: string) {
  let jwtToDecode = jwt || getDataFromSession('pdfUserJwt');

  if (!jwtToDecode) {
    return null;
  }
  const payload = jwtToDecode?.split('.')[1];
  const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
  return JSON.parse(decoded);
}

export const formatIsoTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    const formatted = date.toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return formatted.replace(/\s?(a\.m\.|p\.m\.)/i, (match) =>
      match.includes('a.m.') ? ' AM' : ' PM',
    );
  } catch (error) {
    console.error('Error formatting date:', error);
    return timestamp;
  }
};

export const convertAddressToBech32 = (address: string) => {
  if (address.includes('addr') || address.includes('stake')) {
    return address;
  } else if (address.includes('drep')) {
    return convertDrepPhraseToCIP105(address)
  } else
    return Address.from_bytes(Buffer.from(address, 'hex') as any).to_bech32();
};
