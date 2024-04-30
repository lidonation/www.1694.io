import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
  ManyToMany,
} from 'typeorm';
import { Delegator } from './delegator.entity';
import { Note } from './note.entity';

enum ReactionTypeName {
  Like = 'like',
  ThumbsUp = 'thumbsup',
  ThumbsDown = 'thumbsdown',
  Rocket = 'rocket',
}

@Entity()
@Unique(['delegator', 'type']) // Ensures delegator cant like or thumbs up twice
export class Reaction {
  //auto increment primary key decorator
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ReactionTypeName,
    default: ReactionTypeName.Like,
    nullable: false,
  })
  type: ReactionTypeName;

  @ManyToMany(() => Note, (note) => note.reactions)
  note: Note[];

  @ManyToOne(() => Delegator, (delegator) => delegator.reactions) // Many-to-One relationship with Delegator
  delegator: Delegator;
  //timestamps
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
