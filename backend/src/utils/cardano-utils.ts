import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import * as blakejs from 'blakejs';
import { bech32 } from 'bech32';
import * as cbor from 'cbor';
import { string } from 'joi';

export interface AddressInfo {
  addr: string;
  hex: string;
  type: string;
  network: string;
  matchPubKey: boolean;
}

export interface SignatureVerificationResult {
  workMode: string;
  payloadResultMatch: boolean;
  publicKeyHex: string;
  publicKeyMatch?: boolean;
  addressHex?: string;
  payloadDataHex: string;
  signature: string;
  publicKey: string;
  error?: string;
}

export interface WitnessVerificationResult {
  workMode: string;
  publicKeyHex: string;
  publicKeyMatch: boolean;
  addressHex: string;
  signature: string;
  witnessSetHex: string;
}

export interface ConvertedSignature {
  vkey: string;
  signature: string;
}

export interface VerifySignatureInput {
  signatures: {
    vkey: string;
    signature: string;
  };
  address: string;
}

/**
 * Regular expression for validating hex strings
 */
const regExpHex = /^[0-9a-fA-F]+$/;

/**
 * Trim whitespace from string
 */
export function trimString(s: string): string {
  s = s.replace(/(^\s*)|(\s*$)/gi, ''); //exclude start and end white-space
  s = s.replace(/\n /, '\n'); // exclude newline with a start spacing
  return s;
}

/**
 * Generate Blake2b hash
 */
export function getHash(content: string, digestLengthBytes = 32): string {
  return blakejs.blake2bHex(
    Buffer.from(content, 'hex'),
    null,
    digestLengthBytes,
  );
}

/**
 * Convert address to hex format with type and network detection
 */
export function readAddr2hex(addr: string, publicKey?: string): AddressInfo {
  let addr_hex;
  let addr_type = 'hash';
  let addr_network = 'unknown';
  let addr_matchPubKey = false;

  // first check, if the given address is an empty string, throw error
  if (trimString(addr) == '') {
    throw new Error('The address value is empty');
  }

  // try to use the parameter as a bech encoded string
  if (!addr_hex) {
    try {
      addr_hex = Buffer.from(
        bech32.fromWords(bech32.decode(addr, 1000).words),
      ).toString('hex');
      //ok, no failure so far. lets check if we can figure out if its a governance bech
      if (addr.startsWith('drep') && addr_hex.length == 56) {
        addr_type = 'drep';
      } else if (addr.startsWith('drep_script')) {
        addr_type = 'drep script';
      } else if (addr.startsWith('cc_cold') && addr_hex.length == 56) {
        addr_type = 'committee-cold';
      } else if (addr.startsWith('cc_cold_script')) {
        addr_type = 'committee-cold script';
      } else if (addr.startsWith('cc_hot') && addr_hex.length == 56) {
        addr_type = 'committee-hot';
      } else if (addr.startsWith('cc_hot_script')) {
        addr_type = 'committee-hot script';
      }
    } catch (error) {}
  }

  // try to use the parameter as a direct hex string if bech32 failed
  if (!addr_hex) {
    addr_hex = trimString(addr.toLowerCase());
    //check that the given key is a hex string
    if (!regExpHex.test(addr_hex)) {
      throw new Error(
        `Provided address '${addr}' is either not a valid hex string, bech encoded address, or the file is missing`,
      );
    }
  }

  // check the address type if addr_hex is longer than 56 chars, otherwise its a simple hash
  if (addr_hex.length > 56 && addr_type == 'hash') {
    hashcheck: {
      // check if there is a cip129 governance hash present (hash hex length 58 chars)
      if (addr_hex.length == 58) {
        switch (addr_hex.substring(0, 2)) {
          case '02':
            addr_type = 'committee-hot cip129';
            break hashcheck;
          case '03':
            addr_type = 'committee-hot script cip129';
            break hashcheck;
          case '12':
            addr_type = 'committee-cold cip129';
            break hashcheck;
          case '13':
            addr_type = 'committee-cold script cip129';
            break hashcheck;
          case '22':
            addr_type = 'drep cip129';
            break hashcheck;
          case '23':
            addr_type = 'drep script cip129';
            break hashcheck;
        }
      }

      // check normal hashes
      // get the address type for information
      switch (addr_hex.substring(0, 1)) {
        case '0':
          addr_type = 'payment base';
          break;
        case '1':
          addr_type = 'script base';
          break;
        case '2':
          addr_type = 'payment script';
          break;
        case '3':
          addr_type = 'script script';
          break;
        case '4':
          addr_type = 'payment pointer';
          break;
        case '5':
          addr_type = 'script pointer';
          break;
        case '6':
          addr_type = 'payment enterprise';
          break;
        case '7':
          addr_type = 'script';
          break;
        case 'e':
          addr_type = 'stake';
          break;
        case 'f':
          addr_type = 'stake script';
          break;
        default:
          addr_type = 'unknown';
      }

      // get the address network information
      switch (addr_hex.substring(1, 2)) {
        case '0':
          addr_network = 'testnet';
          break;
        case '1':
          addr_network = 'mainnet';
          break;
        default:
          addr_network = 'unknown';
      }
    }
  }

  // optional check if the address matches the given publicKey
  if (publicKey && addr_hex.includes(getHash(publicKey, 28))) {
    // set addr_matchPubKey to true if the address contain the pubKey hash
    addr_matchPubKey = true;
  }

  return {
    addr: addr,
    hex: addr_hex,
    type: addr_type,
    network: addr_network,
    matchPubKey: addr_matchPubKey,
  };
}

/**
 * Convert Ed25519 public key to CBOR format
 */
export function convertEd25519KeyToCbor(publicKeyHex: string): string {
  try {
    // Validate input
    if (!publicKeyHex?.match(/^[0-9a-fA-F]{64}$/)) {
      console.log('Invalid Ed25519 public key format, skipping conversion');
      return publicKeyHex;
    }

    // Create COSE_Key structure for Ed25519
    const coseKey = new Map<number, number | Buffer>([
      [1, 1], // kty: OKP (Octet Key Pair)
      [3, -8], // alg: EdDSA
      [-1, 6], // crv: Ed25519
      [-2, Buffer.from(publicKeyHex, 'hex')], // x: public key
    ]);

    // Encode to CBOR
    const cborBuffer = cbor.encode(coseKey);

    // Return hex string
    return cborBuffer.toString('hex');
  } catch (error) {
    throw new Error(`Failed to convert Ed25519 key to CBOR: ${error.message}`);
  }
}

/**
 * Convert Ed25519 signature to CBOR COSE_Sign1 format
 */
export function convertEd25519SignatureToCbor(
  signatureHex: string,
  address?: string,
): string {
  if (!signatureHex?.match(/^[0-9a-fA-F]{128}$/)) {
    console.log('Invalid Ed25519 signature format, skipping conversion');
    return signatureHex;
  }

  // Convert the address to hex if it's provided
  let addressHex;
  if (address) {
    // Use the existing readAddr2hex function to convert the address
    const addrInfo = readAddr2hex(address);
    addressHex = addrInfo.hex;
  }

  // Creating protected header with both algorithm and address
  const protectedHeader = new Map<number | string, number | string>([
    [1, -8], // algorithm: EdDSA
    ['address', addressHex], // Include the address
  ]);

  const coseSign1 = [
    cbor.encode(protectedHeader), // Protected header with hex address
    new Map(), // Unprotected header
    new Uint8Array(0), // Empty payload for CIP-95 witness
    Buffer.from(signatureHex, 'hex'), // Signature
  ];

  const cborHex = cbor.encode(coseSign1).toString('hex');
  return cborHex;
}

/**
 * Convert Bech32 encoded key to CBOR format
 */
export function convertBech32KeyToCbor(bech32Key: string): string {
  try {
    // Decode Bech32 key
    const decoded = bech32.decode(bech32Key);
    const pubKeyBytes = Buffer.from(bech32.fromWords(decoded.words));

    // Create COSE_Key structure for Ed25519
    const coseKey = new Map<number, number | Buffer>([
      [1, 1], // kty: OKP (Octet Key Pair)
      [3, -8], // alg: EdDSA
      [-1, 6], // crv: Ed25519
      [-2, pubKeyBytes], // x: public key
    ]);

    const cborHex = cbor.encode(coseKey).toString('hex');

    return cborHex;
  } catch (error) {
    console.error('Bech32 key conversion error:', error);
    throw new Error(`Failed to convert Bech32 key: ${error.message}`);
  }
}

/**
 * Convert key and signature to CBOR format
 */
export function convertKeyAndSignatureToCbor(
  key: string,
  signature: string,
  address: string,
): ConvertedSignature {
  // Convert key based on format
  const keyHex = key.startsWith('ed25519_pk')
    ? convertBech32KeyToCbor(key)
    : convertEd25519KeyToCbor(key);

  // Convert signature
  const sigHex = convertEd25519SignatureToCbor(signature, address);

  return {
    vkey: keyHex,
    signature: sigHex,
  };
}

/**
 * Get public key from vkey (supports both hex and bech32 formats)
 */
export function getPublicKeyFromVkey(vkey: string): CardanoWasm.PublicKey {
  try {
    if (vkey.startsWith('ed25519_pk')) {
      // If it's bech32 encoded, decode it first
      const decoded = bech32.decode(vkey);
      const keyBytes = Buffer.from(bech32.fromWords(decoded.words));
      return CardanoWasm.PublicKey.from_bytes(keyBytes);
    } else {
      // If it's hex, convert directly
      return CardanoWasm.PublicKey.from_bytes(Buffer.from(vkey, 'hex'));
    }
  } catch (error) {
    throw new Error(`Invalid vkey format: ${error.message}`);
  }
}

/**
 * Check if a signature is in CBOR format
 */
export function isCBORFormat(signature: string): boolean {
  try {
    const buffer = Buffer.from(signature, 'hex');
    cbor.decode(buffer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verify COSE_Sign1 signature (can verify signatures of type COSE_Sign1 and COSE_Key pair)
 */
export async function verifySignature(
  payloadUnverified: VerifySignatureInput,
): Promise<SignatureVerificationResult> {
  try {
    const convertedSigs = convertKeyAndSignatureToCbor(
      payloadUnverified.signatures.vkey,
      payloadUnverified.signatures.signature,
      payloadUnverified.address,
    );

    const signatures = {
      vkey: convertedSigs.vkey,
      signature: convertedSigs.signature,
    };
    const { address } = payloadUnverified;

    // Validate COSE_Key presence and format
    let COSE_Key_cbor_hex = signatures?.vkey;
    if (typeof COSE_Key_cbor_hex === 'undefined') {
      throw new Error('Missing COSE_Key parameter signature.vkey');
    }
    COSE_Key_cbor_hex = trimString(COSE_Key_cbor_hex.toLowerCase());

    // Check hex validity
    if (!regExpHex.test(COSE_Key_cbor_hex)) {
      throw new Error('COSE_Key is not a valid hex string');
    }

    // Validate COSE_Sign1 presence and format
    let COSE_Sign1_cbor_hex = signatures?.signature;
    if (typeof COSE_Sign1_cbor_hex === 'undefined') {
      throw new Error(
        'Missing COSE_Sign1 signature parameter signatures.signature',
      );
    }
    COSE_Sign1_cbor_hex = trimString(COSE_Sign1_cbor_hex.toLowerCase());

    // Check hex validity
    if (!regExpHex.test(COSE_Sign1_cbor_hex)) {
      throw new Error('COSE_Sign1 is not a valid hex string');
    }

    // Decode COSE Key
    let COSE_Key_structure;
    try {
      COSE_Key_structure = cbor.decode(Buffer.from(COSE_Key_cbor_hex, 'hex'));
    } catch (error) {
      throw new Error(
        `Can't cbor decode the given COSE_Key signature (${error})`,
      );
    }

    // Validate COSE Key structure
    if (!(COSE_Key_structure instanceof Map) || COSE_Key_structure.size < 4) {
      throw new Error(
        'COSE_Key is not valid. It must be a map with at least 4 entries: kty,alg,crv,x.',
      );
    }
    if (COSE_Key_structure.get(1) !== 1) {
      throw new Error('COSE_Key map label "1" (kty) is not "1" (OKP)');
    }
    if (COSE_Key_structure.get(3) !== -8) {
      throw new Error('COSE_Key map label "3" (alg) is not "-8" (EdDSA)');
    }
    if (COSE_Key_structure.get(-1) !== 6) {
      throw new Error('COSE_Key map label "-1" (crv) is not "6" (Ed25519)');
    }
    if (!COSE_Key_structure.has(-2)) {
      throw new Error('COSE_Key map label "-2" (public key) is missing');
    }

    // Get public key
    const pubKey_buffer = COSE_Key_structure.get(-2);
    if (!Buffer.isBuffer(pubKey_buffer)) {
      throw new Error('PublicKey entry in the COSE_Key is not a bytearray');
    }
    const pubKey = pubKey_buffer.toString('hex');

    // Verify the drepId (address) belongs to the public key
    const sign_addr = readAddr2hex(address, pubKey);
    if (!sign_addr.matchPubKey) {
      throw new Error(
        'The given drep address does not belong to the public key in the COSE_Key',
      );
    }

    // Load public key
    const publicKey = CardanoWasm.PublicKey.from_bytes(
      Buffer.from(pubKey, 'hex'),
    );

    // Decode COSE_Sign1
    let COSE_Sign1_structure;
    try {
      COSE_Sign1_structure = cbor.decode(
        Buffer.from(COSE_Sign1_cbor_hex, 'hex'),
      );
    } catch (error) {
      throw new Error(
        `Can't cbor decode the given COSE_Sign1 signature (${error})`,
      );
    }

    // Validate COSE_Sign1 structure
    if (
      !Array.isArray(COSE_Sign1_structure) ||
      COSE_Sign1_structure.length !== 4
    ) {
      throw new Error(
        'COSE_Sign1 is not a valid signature. It must be an array with 4 entries.',
      );
    }

    // Extract content from COSE_Sign1_structure
    const [
      protectedHeader_buffer,
      unprotectedHeader,
      payload_buffer,
      signature_buffer,
    ] = COSE_Sign1_structure;

    // 1) Validate and decode protected header
    if (!Buffer.isBuffer(protectedHeader_buffer)) {
      throw new Error('Protected header is not a bytearray (serialized) cbor');
    }

    let protectedHeader;
    try {
      protectedHeader = cbor.decode(protectedHeader_buffer);
    } catch (error) {
      throw new Error(`Can't cbor decode the protected header (${error})`);
    }

    if (!protectedHeader.has(1)) {
      throw new Error('Protected header map label "1" is missing');
    }
    if (protectedHeader.get(1) !== -8) {
      throw new Error(
        'Protected header map label "1" (alg) is not "-8" (EdDSA)',
      );
    }
    if (!protectedHeader.has('address')) {
      throw new Error('Protected header map label "address" is missing');
    }

    // 2) Process unprotectedHeader as in executable
    let unprotectedHeader_processed = unprotectedHeader;
    if (
      !(unprotectedHeader instanceof Map) &&
      typeof unprotectedHeader === 'object'
    ) {
      unprotectedHeader_processed = new Map(Object.entries(unprotectedHeader));
    }
    if (!(unprotectedHeader_processed instanceof Map)) {
      throw new Error('Unprotected header is not a map');
    }

    // Create Sig_structure
    const Sig_structure = [
      'Signature1',
      protectedHeader_buffer,
      Buffer.from(''),
      payload_buffer,
    ];

    // Convert to CBOR for verification
    const Sig_structure_cbor_hex = cbor.encode(Sig_structure).toString('hex');

    // Load signature
    if (!Buffer.isBuffer(signature_buffer)) {
      throw new Error('Signature is not a bytearray');
    }
    const signature_hex = signature_buffer.toString('hex');
    const ed25519signature =
      CardanoWasm.Ed25519Signature.from_hex(signature_hex);

    // Verify signature
    const verified = publicKey.verify(
      Buffer.from(Sig_structure_cbor_hex, 'hex'),
      ed25519signature,
    );

    // Return result with extended information
    return {
      workMode: 'verify-cip30',
      payloadResultMatch: verified,
      publicKeyHex: pubKey,
      publicKeyMatch: sign_addr.matchPubKey,
      addressHex: sign_addr.hex,
      payloadDataHex: payload_buffer.toString('hex'),
      signature: signature_hex,
      publicKey: pubKey,
    };
  } catch (error) {
    console.error('Error during verification:', error);
    return {
      workMode: 'verify-cip30',
      payloadResultMatch: false,
      publicKeyHex: '',
      payloadDataHex: '',
      signature: '',
      publicKey: '',
      error: error?.message || 'Verification failed',
    };
  }
}

/**
 * Verify signature from login file (without address validation)
 */
export async function verifySignatureFromLoginFile(signatures: {
  vkey: string;
  signature: string;
}): Promise<SignatureVerificationResult> {
  try {
    let COSE_Key_cbor_hex = signatures?.vkey;
    if (typeof COSE_Key_cbor_hex === 'undefined') {
      throw new Error('Missing COSE_Key parameter signature.vkey');
    }
    COSE_Key_cbor_hex = trimString(COSE_Key_cbor_hex.toLowerCase());

    if (!regExpHex.test(COSE_Key_cbor_hex)) {
      throw new Error('COSE_Key is not a valid hex string');
    }

    let COSE_Sign1_cbor_hex = signatures?.signature;
    if (typeof COSE_Sign1_cbor_hex === 'undefined') {
      throw new Error(
        'Missing COSE_Sign1 signature parameter signatures.signature',
      );
    }
    COSE_Sign1_cbor_hex = trimString(COSE_Sign1_cbor_hex.toLowerCase());

    if (!regExpHex.test(COSE_Sign1_cbor_hex)) {
      throw new Error('COSE_Sign1 is not a valid hex string');
    }

    let COSE_Key_structure;
    let pubKeyBytes;
    try {
      COSE_Key_structure = cbor.decode(Buffer.from(COSE_Key_cbor_hex, 'hex'));
    } catch (error) {
      //maybe the cose key is the public key in hex format
      //attept to get the public key from hex
      try {
        const pubKey = getPublicKeyFromVkey(COSE_Key_cbor_hex);
        pubKeyBytes = pubKey.as_bytes();
      } catch (error) {
        throw new Error(
          `Can't cbor decode the given COSE_Key signature (${error})`,
        );
      }
    }

    if (!pubKeyBytes && COSE_Key_structure) {
      // Validate COSE Key structure
      if (!(COSE_Key_structure instanceof Map) || COSE_Key_structure.size < 4) {
        throw new Error(
          'COSE_Key is not valid. It must be a map with at least 4 entries: kty,alg,crv,x.',
        );
      }
      if (COSE_Key_structure.get(1) !== 1) {
        throw new Error('COSE_Key map label "1" (kty) is not "1" (OKP)');
      }
      if (COSE_Key_structure.get(3) !== -8) {
        throw new Error('COSE_Key map label "3" (alg) is not "-8" (EdDSA)');
      }
      if (COSE_Key_structure.get(-1) !== 6) {
        throw new Error('COSE_Key map label "-1" (crv) is not "6" (Ed25519)');
      }
      if (!COSE_Key_structure.has(-2)) {
        throw new Error('COSE_Key map label "-2" (public key) is missing');
      }
    }

    // Get public key
    const pubKey_buffer = pubKeyBytes || COSE_Key_structure.get(-2);
    if (!Buffer.isBuffer(pubKey_buffer)) {
      throw new Error('PublicKey entry in the COSE_Key is not a bytearray');
    }
    const pubKey = pubKey_buffer.toString('hex');

    // Load public key
    const publicKey = CardanoWasm.PublicKey.from_bytes(
      Buffer.from(pubKey, 'hex'),
    );

    // Decode COSE_Sign1
    let COSE_Sign1_structure;
    try {
      COSE_Sign1_structure = cbor.decode(
        Buffer.from(COSE_Sign1_cbor_hex, 'hex'),
      );
    } catch (error) {
      throw new Error(
        `Can't cbor decode the given COSE_Sign1 signature (${error})`,
      );
    }

    // Validate COSE_Sign1 structure
    if (
      !Array.isArray(COSE_Sign1_structure) ||
      COSE_Sign1_structure.length !== 4
    ) {
      throw new Error(
        'COSE_Sign1 is not a valid signature. It must be an array with 4 entries.',
      );
    }

    // Extract content from COSE_Sign1_structure
    const [
      protectedHeader_buffer,
      unprotectedHeader,
      payload_buffer,
      signature_buffer,
    ] = COSE_Sign1_structure;

    // 1) Validate and decode protected header
    if (!Buffer.isBuffer(protectedHeader_buffer)) {
      throw new Error('Protected header is not a bytearray (serialized) cbor');
    }

    let protectedHeader;
    try {
      protectedHeader = cbor.decode(protectedHeader_buffer);
    } catch (error) {
      throw new Error(`Can't cbor decode the protected header (${error})`);
    }

    if (!protectedHeader.has(1)) {
      throw new Error('Protected header map label "1" is missing');
    }
    if (protectedHeader.get(1) !== -8) {
      throw new Error(
        'Protected header map label "1" (alg) is not "-8" (EdDSA)',
      );
    }
    if (!protectedHeader.has('address')) {
      throw new Error('Protected header map label "address" is missing');
    }

    // 2) Process unprotectedHeader as in executable
    let unprotectedHeader_processed = unprotectedHeader;
    if (
      !(unprotectedHeader instanceof Map) &&
      typeof unprotectedHeader === 'object'
    ) {
      unprotectedHeader_processed = new Map(Object.entries(unprotectedHeader));
    }
    if (!(unprotectedHeader_processed instanceof Map)) {
      throw new Error('Unprotected header is not a map');
    }

    // Create Sig_structure
    const Sig_structure = [
      'Signature1',
      protectedHeader_buffer,
      Buffer.from(''),
      payload_buffer,
    ];

    // Convert to CBOR for verification
    const Sig_structure_cbor_hex = cbor.encode(Sig_structure).toString('hex');

    // Load signature
    if (!Buffer.isBuffer(signature_buffer)) {
      throw new Error('Signature is not a bytearray');
    }
    const signature_hex = signature_buffer.toString('hex');
    const ed25519signature =
      CardanoWasm.Ed25519Signature.from_hex(signature_hex);

    // Verify signature
    const verified = publicKey.verify(
      Buffer.from(Sig_structure_cbor_hex, 'hex'),
      ed25519signature,
    );

    // Return result with extended information
    return {
      workMode: 'verify-cip30',
      payloadResultMatch: verified,
      publicKeyHex: pubKey,
      payloadDataHex: payload_buffer.toString('hex'),
      signature: signature_hex,
      publicKey: pubKey,
    };
  } catch (error) {
    console.error('Error during verification:', error);
    throw new Error(error.message || 'Verification failed');
  }
}

export function verifySignatureWithSignedMessage({
  signatureCbor,
  message,
}: {
  signatureCbor: string;
  message: string;
}) {
  ///decode the cbor, then hash the message to see if they match
  let COSE_Sign1_structure;
  try {
    COSE_Sign1_structure = cbor.decode(Buffer.from(signatureCbor, 'hex'));
  } catch (error) {
    throw new Error(
      `Can't cbor decode the given COSE_Sign1 signature (${error})`,
    );
  }

  // Validate COSE_Sign1 structure
  if (
    !Array.isArray(COSE_Sign1_structure) ||
    COSE_Sign1_structure.length !== 4
  ) {
    throw new Error(
      'COSE_Sign1 is not a valid signature. It must be an array with 4 entries.',
    );
  }

  // Extract content from COSE_Sign1_structure
  const [
    _protectedHeader_buffer,
    _unprotectedHeader,
    payload_buffer,
    _signature_buffer,
  ] = COSE_Sign1_structure;

  const messageBytes = Buffer.from(message, 'utf8');
  const messageHex = messageBytes.toString('hex');
  const payloadHex = payload_buffer.toString('hex');

  if (messageHex !== payloadHex) {
    return {
      workMode: 'verify-signed-message',
      payloadResultMatch: false,
      payloadDataHex: payload_buffer.toString('hex'),
      messageHash: messageHex,
      error: 'Payload in signature does not match the hashed message',
    };
  }
  return {
    workMode: 'verify-signed-message',
    payloadResultMatch: true,
    payloadDataHex: payload_buffer.toString('hex'),
    messageHash: messageHex,
  };
}

/**
 * Verify transaction witness (can verify Ed25519 key pair only)
 */
export async function verifyTxWitness(witnessData: {
  witnessSet: {
    vkey: string;
    signature: string;
  };
  address: string;
}): Promise<WitnessVerificationResult> {
  try {
    const publicKey = getPublicKeyFromVkey(witnessData.witnessSet.vkey);

    const addressInfo = readAddr2hex(witnessData.address, publicKey.to_hex());

    // Create witness set
    const witnessSet = CardanoWasm.TransactionWitnessSet.new();
    const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
    const vkeyWitness = CardanoWasm.Vkeywitness.new(
      CardanoWasm.Vkey.new(publicKey),
      CardanoWasm.Ed25519Signature.from_hex(witnessData.witnessSet.signature),
    );
    vkeyWitnesses.add(vkeyWitness);
    witnessSet.set_vkeys(vkeyWitnesses);

    return {
      workMode: 'verify-witness',
      publicKeyHex: witnessData.witnessSet.vkey,
      publicKeyMatch: addressInfo.matchPubKey,
      addressHex: addressInfo.hex,
      signature: witnessData.witnessSet.signature,
      witnessSetHex: witnessSet.to_hex(),
    };
  } catch (error) {
    console.error('Error during witness verification:', error);
    throw new Error(error.message || 'Witness verification failed');
  }
}
