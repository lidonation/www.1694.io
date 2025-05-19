import { BaseEntity } from '../global/base.entity';
import { Column, Entity } from 'typeorm';

export enum OAuthProviderType {
  GOVTOOLS = 'govtools',
}

@Entity({ name: 'oauth' })
export class OAuth extends BaseEntity {
  @Column({
    type: 'enum',
    enum: OAuthProviderType,
  })
  provider: OAuthProviderType;

  @Column({ type: 'text' })
  accessToken: string;

  @Column({ type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'text', nullable: true })
  providerUserId?: string;

  @Column({ type: 'text' })
  stakeKeyBech32: string;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;
}
