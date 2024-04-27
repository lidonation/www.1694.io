import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Note } from "./note.entity";

@Entity()
export class Drep {
  //auto increment primary key decorator
  @PrimaryGeneratedColumn()
  id: number;
  //Human readable name for the entity
  @Column({ unique: true, nullable: true })
  name: string;
  //More info about the drep
  @Column({ nullable: true})
  bio: string;
  //Platform statement associated with the user
  @Column({ nullable: true })
  platform_statement: string;
  //Information about the user's expertise
  @Column({ nullable: true})
  expertise: string;
  //User's perspective within the decentralized system
  @Column({ nullable: true})
  perspective: string;
  //dreps stake_addr
  @Column({})
  stake_addr: string;
  //dreps voter id
  @Column({ nullable: false , unique:true})
  voter_id: string;
  @OneToMany(() => Note, (note) => note.voter)
  notes: Note[];
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
