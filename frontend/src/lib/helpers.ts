// helpers.js
// This file contains helper functions used throughout the application for performing common tasks.
// Functions include operations such as date formatting, array and object manipulation, and input validation.
import { HASH_REGEX, URL_REGEX } from '@/constants';
import { Networks } from '@/models/enums';

// Use these functions to keep your code clean and avoid duplicating code in different parts of the application.
export function checkImageCompatibity(mimeType: string) {
  if (mimeType === 'image/svg+xml' || mimeType === 'image/svg') return false;
  return true;
}

export function isValidURLFormat(str: string) {
  if (!str.length) return false;
  return URL_REGEX.test(str);
}

export function isValidHashFormat(str: string) {
  if (!str.length) return false;
  return HASH_REGEX.test(str);
}

export function isValidURLLength(s: string) {
  if (s.length > 128) {
    return 'too long URL';
  }

  const encoder = new TextEncoder();
  const byteLength = encoder.encode(s).length;

  return byteLength <= 128 ? true : 'Too long url';
}

export const getNetworkFlag = (network: number) => {
  switch (network) {
    case Networks.mainnet:
      return '--mainnet';
    case Networks.testnet:
      return '--testnet-magic 2';
    default:
      return '--testnet-magic 2';
  }
};

export function parseURL(urlString: string) {
  // If URL already has a protocol, return as is
  if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
    return urlString;
  }

  try {
    // Add https:// as default protocol
    const urlWithProtocol = `https://${urlString}`;
    const url = new URL(urlWithProtocol);

    // Ensure the URL has a valid hostname
    if (!url.hostname) {
      console.error('Invalid URL: missing hostname');
      return urlString;
    }

    return url.href;
  } catch (error) {
    console.error('Invalid URL:', error);
    return urlString;
  }
}
