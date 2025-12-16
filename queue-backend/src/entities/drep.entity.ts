import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("drep")
export class Drep {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  drepId: string;

  @Column()
  paymentAddress: string;

  @Column()
  active: boolean;

  @Column()
  retired: boolean;
}
