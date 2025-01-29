import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Drep } from './drep.entity';

@Entity()
export class Signature {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Drep, (drep) => drep.id, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  drep: Drep;

  @Column({ nullable: true, unique: false, default: null })
  drep_bech32: string;

  @Column({ nullable: true })
  voterId: string; //drepbech32

  @Column({ nullable: true })
  stakeKey: string;

  @Column({ nullable: true, unique: false, default: null })
  signature: string;

  @Column({ nullable: true, unique: false, default: null })
  signatureKey: string;

  @Column({ nullable: true, unique: false, default: null })
  lastSignedIn: Date;

  @Column({ nullable: true, unique: false, default: null })
  type: string;
}
