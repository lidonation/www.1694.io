import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { OAuth, OAuthProviderType } from 'src/entities/oauth.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class OAuthRepository extends Repository<OAuth> {
  constructor(
    @InjectDataSource('default')
    private dataSource: DataSource,
  ) {
    super(OAuth, dataSource.createEntityManager());
  }

  async findByProviderAndStakeKey(
    provider: OAuthProviderType,
    stakeKeyBech32: string,
  ) {
    return this.findOne({
      where: {
        provider,
        stakeKeyBech32,
      },
    });
  }

  async createOAuth(oAuthData: Partial<OAuth>) {
    const newOAuth = this.create(oAuthData);
    return this.save(newOAuth);
  }

  async updateOAuth(id: number, updateData: any) {
    const existing = await this.findOne({ where: { id } });
    if (existing) {
      const updated = this.merge(existing, updateData);
      return this.save(updated);
    }
    throw new Error('OAuth record not found');
  }

  async findByStakeKey(stakeKeyBech32: string) {
    return this.find({
      where: { stakeKeyBech32 },
    });
  }

  async findByStakeKeyAndId(stakeKeyBech32: string, id: number) {
    return this.findOne({
      where: { stakeKeyBech32, id },
    });
  }

  async deleteOAuth(id: number) {
    const oAuth = await this.findOne({ where: { id } });
    if (oAuth) {
      return this.remove(oAuth);
    }
    throw new Error('OAuth record not found');
  }
}
