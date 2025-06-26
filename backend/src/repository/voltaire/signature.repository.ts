import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Drep } from 'src/entities/drep.entity';
import { Signature } from 'src/entities/signatures.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class SignatureRepository extends Repository<Signature> {
  constructor(
    @InjectDataSource('default')
    private dataSource: DataSource,
  ) {
    super(Signature, dataSource.createEntityManager());
  }

  async createSignature(signature: Partial<Signature>): Promise<Signature> {
    const newSignature = this.create(signature);
    return this.save(newSignature);
  }

  async findById(id: number) {
    return this.findOne({ where: { id } });
  }

  async findByStakeKey(stakeKey: string) {
    return this.findOne({ where: { stakeKey } });
  }

  async findAll() {
    return this.find();
  }

  async findByStakeKeyAndSignatureKey(
    stakeKey: string,
    signatureKey: string,
  ): Promise<Signature | null> {
    return this.findOne({
      where: { stakeKey, signatureKey },
    });
  }

  async linkSignaturesToDRepWithTransaction({
    drepId,
    signatures,
    voterId,
    stakeKey,
    drep_bech32,
  }: {
    drepId: number;
    voterId: string;
    stakeKey: string;
    signatures: { signature: string; key: string }[];
    drep_bech32: string;
  }) {
    // Input validation
    if (!drepId || !signatures || signatures.length === 0) {
      throw new HttpException(
        'DRep ID and signatures are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const drep = await manager.getRepository(Drep).findOne({
        where: { id: drepId },
      });

      if (!drep) {
        throw new HttpException('DRep not found', HttpStatus.NOT_FOUND);
      }

      const signatureRepo = manager.getRepository(Signature);
      const results = [];

      // Process each signature within the transaction
      for (const sig of signatures) {
        if (!sig.signature || !sig.key) {
          throw new HttpException(
            'Signature and key are required for each signature',
            HttpStatus.BAD_REQUEST,
          );
        }

        // Check if signature already exists
        const existingSignature = await signatureRepo.findOne({
          where: {
            stakeKey: sig.key,
            signature: sig.signature,
          },
        });

        if (existingSignature) {
          // Update existing signature with DRep link
          existingSignature.drep = drep;
          existingSignature.voterId = voterId;
          existingSignature.drep_bech32 = drep_bech32;

          const updated = await signatureRepo.save(existingSignature);
          results.push({ action: 'updated', signatureId: updated.id });
        } else {
          // Create new signature
          const newSignature = signatureRepo.create({
            stakeKey,
            signatureKey: sig.key,
            signature: sig.signature,
            drep,
            voterId,
            drep_bech32,
          });

          const created = await signatureRepo.save(newSignature);
          results.push({ action: 'created', signatureId: created.id });
        }
      }

      return {
        message: 'Signatures linked to DRep successfully',
        results,
        totalProcessed: signatures.length,
      };
    });
  }
}
