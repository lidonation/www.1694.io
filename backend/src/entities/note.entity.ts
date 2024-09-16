import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { Drep } from './drep.entity';
import { BaseEntity } from 'src/global';
import { Reaction } from './reaction.entity';
import { Signature } from './signatures.entity';

@Entity()
export class Note extends BaseEntity {
  @Column({ unique: true, nullable: false })
  note_title: string;

  @Column('simple-array', { nullable: true })
  note_tag: string[];

  @Column({ nullable: false })
  note_content: string;

  @ManyToOne(() => Drep, (drep) => drep.id)
  drep: Drep; // This is the Drep/ drep page that the note belongs to/will be hosted by
  
  @ManyToOne(() => Signature, (signature) => signature.id)
  author: Signature; // This is the Signature/ user that wrote the note

  @Column()
  note_visibility: string;

  @OneToMany(() => Reaction, (reaction) => reaction.note, {
    onDelete: 'CASCADE',
  })
  reactions: Reaction[];
}
