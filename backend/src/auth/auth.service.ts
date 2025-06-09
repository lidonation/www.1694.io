import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import * as blakejs from 'blakejs';
import { bech32 } from 'bech32';
import * as cbor from 'cbor';
import jwtConstants from './jwtConstants';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  CreateOAuthDto,
  UpdateOAuthDto,
  VerifyDRepSignatureDto,
} from './auth.dto';
import { OAuth, OAuthProviderType } from 'src/entities/oauth.entity';
import { GovtoolsOAuthProvider } from './providers/govtools-oauth.provider';

type Payload = {
  drepId?: string;
  voterId?: string;
  stakeKey: string;
  signature: string;
  key: string;
  type?: string;
};

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectDataSource('default')
    private voltaireService: DataSource,
    private readonly govtoolsOAuthProvider: GovtoolsOAuthProvider,
  ) {}

  private regExpHex = /^[0-9a-fA-F]+$/;
  async signJWT(payload: Payload, tte: number | string) {
    const accessSecret = jwtConstants.secret;
    return this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: tte as string,
    });
  }
  async verifyJWT(token: string) {
    const accessSecret = jwtConstants.secret;
    return this.jwtService.verifyAsync(token, {
      secret: accessSecret,
    });
  }
  async login(
    payload: {
      drepId?: string;
      voterId?: string;
      drep_bech32: string;
      stakeKey: string;
      signatures: {
        signature: string;
        key: string;
        type: string;
      }[];
    },
    tte: number | string,
  ) {
    //basically should check if the user signature is valid in the case of a drep or just provide a token for a normal user.
    const mainPayload: Payload = {
      drepId: payload.drepId,
      voterId: payload.voterId,
      stakeKey: payload.stakeKey,
      signature: payload.signatures[0].signature,
      key: payload.signatures[0].key,
      type: payload.signatures[0].type,
    };
    let insertedSig;
    const token = await this.signJWT(mainPayload, tte);
    for (const sig of payload.signatures) {
      const signatureDto = {
        stakeKey: payload.stakeKey,
        signature: sig.signature,
        signatureKey: sig.key,
        drep: payload.drepId,
        voterId: payload.voterId,
        drep_bech32: payload.drep_bech32,
        type: sig.type,
      };
      //check for existing signature
      const existingSig = await this.voltaireService
        .getRepository('Signature')
        .findOne({
          where: { stakeKey: payload.stakeKey, signatureKey: sig.key },
          relations: ['drep'],
        });
      if (existingSig) {
        let updatedSig = existingSig;
        if (!existingSig.drep) {
          //update the signature with the drepId
          updatedSig = await this.voltaireService
            .getRepository('Signature')
            .update(existingSig.id, signatureDto);
        }
        return { token, updatedSig, session: existingSig };
      }
      insertedSig = await this.voltaireService
        .getRepository('Signature')
        .createQueryBuilder()
        .insert()
        .into('signature')
        .values({
          ...signatureDto,
          drep: signatureDto.drep,
          drep_bech32: signatureDto.drep_bech32 || '',
          sig_type: signatureDto.type,
        })
        .returning([
          'id',
          'drep_bech32',
          'signature',
          'signatureKey',
          'lastSignedIn',
          'type',
        ])
        .execute();
    }
    return { token, insertedSig, session: insertedSig?.raw[0] };
  }
  async getSession(payload: Payload) {
    const signature = await this.voltaireService
      .getRepository('Signature')
      .findOne({
        where: {
          signature: payload.signature,
          signatureKey: payload.key,
          stakeKey: payload.stakeKey,
        },
      });
    return signature;
  }

  private trimString(s: string) {
    s = s.replace(/(^\s*)|(\s*$)/gi, ''); //exclude start and end white-space
    s = s.replace(/\n /, '\n'); // exclude newline with a start spacing
    return s;
  }

  private getHash(content: string, digestLengthBytes = 32) {
    return blakejs.blake2bHex(
      Buffer.from(content, 'hex'),
      null,
      digestLengthBytes,
    );
  }

  private readAddr2hex(addr: string, publicKey?: string) {
    let addr_hex;
    let addr_type = 'hash';
    let addr_network = 'unknown';
    let addr_matchPubKey = false;

    // first check, if the given address is an empty string, throw error
    if (this.trimString(addr) == '') {
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
      addr_hex = this.trimString(addr.toLowerCase());
      //check that the given key is a hex string
      if (!this.regExpHex.test(addr_hex)) {
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
    if (publicKey && addr_hex.includes(this.getHash(publicKey, 28))) {
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

  convertEd25519KeyToCbor(publicKeyHex: string) {
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
      throw new Error(
        `Failed to convert Ed25519 key to CBOR: ${error.message}`,
      );
    }
  }
  convertEd25519SignatureToCbor(signatureHex: string, address?: string) {
    if (!signatureHex?.match(/^[0-9a-fA-F]{128}$/)) {
      console.log('Invalid Ed25519 signature format, skipping conversion');
      return signatureHex;
    }

    // Convert the address to hex if it's provided
    let addressHex;
    if (address) {
      // Use the existing readAddr2hex function to convert the address
      const addrInfo = this.readAddr2hex(address);
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

  convertBech32KeyToCbor(bech32Key: string) {
    try {
      // Decode Bech32 key
      const decoded = bech32.decode(bech32Key);
      const pubKeyBytes = Buffer.from(bech32.fromWords(decoded.words));

      // Log extracted public key

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

  convertKeyAndSignatureToCbor(
    key: string,
    signature: string,
    address: string,
  ): { vkey: string; signature: string } {
    // Convert key based on format
    const keyHex = key.startsWith('ed25519_pk')
      ? this.convertBech32KeyToCbor(key)
      : this.convertEd25519KeyToCbor(key);

    // Convert signature
    const sigHex = this.convertEd25519SignatureToCbor(signature, address);

    return {
      vkey: keyHex,
      signature: sigHex,
    };
  }
  //can verify signatures of type COSE_Sign1 and COSE_Key pair also ED25519 key pair
  async verifySignature(payloadUnverified: VerifyDRepSignatureDto) {
    try {
      // Input validation exactly as in executable
      payloadUnverified.signatures = this.convertKeyAndSignatureToCbor(
        payloadUnverified.signatures.vkey,
        payloadUnverified.signatures.signature,
        payloadUnverified.address,
      );
      const { signatures, address } = payloadUnverified;

      // Validate COSE_Key presence and format
      let COSE_Key_cbor_hex = signatures?.vkey;
      if (typeof COSE_Key_cbor_hex === 'undefined') {
        throw new Error('Missing COSE_Key parameter signature.vkey');
      }
      COSE_Key_cbor_hex = this.trimString(COSE_Key_cbor_hex.toLowerCase());

      // Check hex validity
      if (!this.regExpHex.test(COSE_Key_cbor_hex)) {
        throw new Error('COSE_Key is not a valid hex string');
      }

      // Validate COSE_Sign1 presence and format
      let COSE_Sign1_cbor_hex = signatures?.signature;
      if (typeof COSE_Sign1_cbor_hex === 'undefined') {
        throw new Error(
          'Missing COSE_Sign1 signature parameter signatures.signature',
        );
      }
      COSE_Sign1_cbor_hex = this.trimString(COSE_Sign1_cbor_hex.toLowerCase());

      // Check hex validity
      if (!this.regExpHex.test(COSE_Sign1_cbor_hex)) {
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
      const sign_addr = this.readAddr2hex(address, pubKey);
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
        throw new Error(
          'Protected header is not a bytearray (serialized) cbor',
        );
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
        unprotectedHeader_processed = new Map(
          Object.entries(unprotectedHeader),
        );
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

  async verifySignatureFromLoginFile(
    signatures: Omit<VerifyDRepSignatureDto, 'address'>['signatures'],
  ) {
    try {
      // Validate COSE_Key presence and format
      let COSE_Key_cbor_hex = signatures?.vkey;
      if (typeof COSE_Key_cbor_hex === 'undefined') {
        throw new Error('Missing COSE_Key parameter signature.vkey');
      }
      COSE_Key_cbor_hex = this.trimString(COSE_Key_cbor_hex.toLowerCase());

      // Check hex validity
      if (!this.regExpHex.test(COSE_Key_cbor_hex)) {
        throw new Error('COSE_Key is not a valid hex string');
      }

      // Validate COSE_Sign1 presence and format
      let COSE_Sign1_cbor_hex = signatures?.signature;
      if (typeof COSE_Sign1_cbor_hex === 'undefined') {
        throw new Error(
          'Missing COSE_Sign1 signature parameter signatures.signature',
        );
      }
      COSE_Sign1_cbor_hex = this.trimString(COSE_Sign1_cbor_hex.toLowerCase());

      // Check hex validity
      if (!this.regExpHex.test(COSE_Sign1_cbor_hex)) {
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
        throw new Error(
          'Protected header is not a bytearray (serialized) cbor',
        );
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
        unprotectedHeader_processed = new Map(
          Object.entries(unprotectedHeader),
        );
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
      throw new HttpException(
        error.message || 'Verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  getPublicKeyFromVkey = (vkey: string): CardanoWasm.PublicKey => {
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
  };
  //can verify Ed25519 key pair only
  async verifyTxWitness(witnessData: {
    witnessSet: {
      vkey: string;
      signature: string;
    };
    address: string;
  }) {
    try {
      const publicKey = this.getPublicKeyFromVkey(witnessData.witnessSet.vkey);

      const addressInfo = this.readAddr2hex(
        witnessData.address,
        publicKey.to_hex(),
      );

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
      throw new HttpException(
        error.message || 'Witness verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async addOAuthProvider(addOAuthPayload: CreateOAuthDto) {
    try {
      const oAuthRepo = this.voltaireService.getRepository<OAuth>(OAuth);
      const existingOAuth = await oAuthRepo.findOne({
        where: {
          provider: addOAuthPayload.provider,
          stakeKeyBech32: addOAuthPayload.stakeKeyBech32,
        },
      });
      if (existingOAuth) {
        //be idempotent and update the existing one
        const updatedOAuth = oAuthRepo.merge(existingOAuth, addOAuthPayload);
        await oAuthRepo.save(updatedOAuth);
        return {
          id: updatedOAuth.id,
          provider: updatedOAuth.provider,
        };
      }
      const newOAuth = oAuthRepo.create(addOAuthPayload);
      const savedOAuth = await oAuthRepo.save(newOAuth);
      return {
        id: savedOAuth.id,
        provider: savedOAuth.provider,
      };
    } catch (error) {
      console.error('Error adding OAuth provider:', error);
      throw new HttpException(
        error.message || 'Error adding OAuth provider',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getOAuthProvidersByStakeKeyBech32(stakeKeyBech32: string) {
    const oAuthRepo = this.voltaireService.getRepository<OAuth>(OAuth);
    const oAuthProviders = await oAuthRepo.find({
      where: { stakeKeyBech32 },
    });
    return oAuthProviders;
  }

  async getOAuthProviderCheck(
    stakeKeyBech32: string,
    provider: OAuthProviderType,
  ) {
    const oAuthRepo = this.voltaireService.getRepository<OAuth>(OAuth);
    const oAuthProvider = await oAuthRepo.findOne({
      where: { stakeKeyBech32, provider },
    });
    return {
      hasProvider: !!oAuthProvider,
    };
  }

  async getOAuthProviderBy(
    provider: OAuthProviderType,
    stakeKeyBech32: string,
  ) {
    const oAuthRepo = this.voltaireService.getRepository<OAuth>(OAuth);
    const oAuthProvider = await oAuthRepo.findOne({
      where: { provider, stakeKeyBech32 },
    });
    if (!oAuthProvider) {
      throw new HttpException('OAuth provider not found', HttpStatus.NOT_FOUND);
    }
    return {
      id: oAuthProvider.id,
      provider: oAuthProvider.provider,
      stakeKeyBech32: oAuthProvider.stakeKeyBech32,
      accessToken: oAuthProvider.accessToken,
      createdAt: oAuthProvider.createdAt,
      updatedAt: oAuthProvider.updatedAt,
    };
  }

  async refreshOAuthProvider({
    stakeKeyBech32,
    provider,
  }: {
    stakeKeyBech32: string;
    provider: OAuthProviderType;
  }) {
    if (!stakeKeyBech32 || !provider) {
      throw new HttpException(
        'Stake Key Bech32 and Provider are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const oAuthRepo = this.voltaireService.getRepository<OAuth>(OAuth);
    const oAuthProvider = await oAuthRepo.findOne({
      where: { stakeKeyBech32, provider },
    });
    if (!oAuthProvider) {
      throw new HttpException('OAuth provider not found', HttpStatus.NOT_FOUND);
    }
    switch (provider) {
      case OAuthProviderType.GOVTOOLS: {
        const refreshedCreds = await this.govtoolsOAuthProvider.refreshToken({
          jwt: oAuthProvider.accessToken,
          refreshToken: oAuthProvider.refreshToken,
        });
        const updatedOAuth = oAuthRepo.merge(oAuthProvider, {
          accessToken: refreshedCreds.jwt,
          refreshToken: refreshedCreds.refreshToken,
        });
        await oAuthRepo.save(updatedOAuth);
        return {
          id: updatedOAuth.id,
          provider: updatedOAuth.provider,
          stakeKeyBech32: updatedOAuth.stakeKeyBech32,
          accessToken: updatedOAuth.accessToken,
          createdAt: updatedOAuth.createdAt,
          updatedAt: updatedOAuth.updatedAt,
        };
      }
      default:
        throw new HttpException(
          'Unsupported OAuth provider',
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  async updateOAuthProvider(updateOAuthPayload: UpdateOAuthDto) {
    const oAuthRepo = this.voltaireService.getRepository<OAuth>(OAuth);
    const existingOAuth = await oAuthRepo.findOne({
      where: { stakeKeyBech32: updateOAuthPayload.stakeKeyBech32 },
    });
    if (!existingOAuth) {
      throw new HttpException('OAuth provider not found', HttpStatus.NOT_FOUND);
    }
    const updatedOAuth = oAuthRepo.merge(existingOAuth, updateOAuthPayload);
    await oAuthRepo.save(updatedOAuth);
    return {
      id: updatedOAuth.id,
      provider: updatedOAuth.provider,
      stakeKeyBech32: updatedOAuth.stakeKeyBech32,
      accessToken: updatedOAuth.accessToken,
      createdAt: updatedOAuth.createdAt,
      updatedAt: updatedOAuth.updatedAt,
    }
  }

  async deleteOAuthProvider(stakeKeyBech32: string, providerId: number) {
    const oAuthRepo = this.voltaireService.getRepository<OAuth>(OAuth);
    if (!stakeKeyBech32 || !providerId) {
      throw new HttpException(
        'Signature ID and Provider ID are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const existingOAuth = await oAuthRepo.findOne({
      where: { stakeKeyBech32, id: providerId },
    });
    if (!existingOAuth) {
      throw new HttpException('OAuth provider not found', HttpStatus.NOT_FOUND);
    }
    await oAuthRepo.remove(existingOAuth);
    return { message: 'OAuth provider deleted successfully' };
  }
}
