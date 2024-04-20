import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Note } from "./note.entity";

@Entity()
export class Drep {
  //auto increment primary key decorator
  @PrimaryGeneratedColumn()
  id: number;
  //Human readable name for the entity
  @Column({ unique: true, nullable: false })
  name: string;
  //More info about the drep
  @Column({})
  bio: string;
  //Platform statement associated with the user
  @Column({ nullable: false })
  platform_statement: string;
  //Information about the user's expertise
  @Column({})
  expertise: string;
  //User's perspective within the decentralized system
  @Column({})
  perspective: string;
  //dreps stake_addr
  @Column({})
  stake_addr: string;
  //dreps voter id
  @Column({ nullable: false })
  voter_id: string;
  @OneToMany(() => Note, (note) => note.drep)
  notes: Note[];
}
