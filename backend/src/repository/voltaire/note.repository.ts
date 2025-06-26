import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Note } from 'src/entities/note.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class NoteRepository extends Repository<Note> {
  constructor(
    @InjectDataSource('default')
    private dataSource: DataSource,
  ) {
    super(Note, dataSource.createEntityManager());
  }

  async createNote(note: Partial<Note>): Promise<Note> {
    const newNote = this.create(note);
    return this.save(newNote);
  }

  async findWithAuthor(id: number) {
    return this.createQueryBuilder('note')
      .leftJoinAndSelect('note.author', 'signature')
      .where('note.id = :id', { id })
      .getOne();
  }

  async updateTimestamp(id: number) {
    const note = await this.findOne({ where: { id } });
    if (note) {
      return this.update({ id }, { updatedAt: new Date() });
    }
  }

  async getNotesWithVisibility(
    delegation?,
    stakeKeyBech32?: string,
    currentNote?: number,
    request?: string,
  ) {
    const queryBuilder = this.createQueryBuilder('note')
      .leftJoinAndSelect('note.drep', 'drep')
      .leftJoin('drep.signatures', 'signature')
      .orderBy('note.createdAt', 'DESC')
      .limit(20);

    queryBuilder.where('note.visibility = :everyone', {
      everyone: 'everyone',
    });

    if (currentNote) {
      if (request === 'before') {
        queryBuilder.where('note.id <= :currentNote', {
          currentNote: Number(currentNote),
        });
      } else if (request === 'after') {
        queryBuilder.where('note.id <= :currentNote', {
          currentNote: Number(currentNote) + 20,
        });
      }
    }

    // 'delegators' visibility
    if (delegation) {
      queryBuilder.orWhere(
        'note.visibility = :delegators AND signature.voterId = :drepVoterId',
        {
          delegators: 'delegators',
          drepVoterId: delegation.drep_view,
        },
      );
    }

    // 'myself' visibility
    if (stakeKeyBech32) {
      queryBuilder.orWhere(
        'note.visibility = :myself AND signature.stakeKey = :stakeKeyBech32',
        {
          myself: 'myself',
          stakeKeyBech32: stakeKeyBech32,
        },
      );
    }

    return queryBuilder.getRawMany();
  }

  async findById(id: number) {
    return this.findOne({ where: { id } });
  }

  async getDRepNotesWithVisibility(
    drepId: number,
    startingTime: Date,
    endingTime: Date,
    stakeKeyBech32?: string,
    delegation?: any,
  ) {
    const queryBuilder = this.createQueryBuilder('note')
      .leftJoinAndSelect('note.drep', 'drep')
      .leftJoin('drep.signatures', 'signature')
      .where('note.drep = :drepId', { drepId })
      .andWhere(
        'note."createdAt"::DATE BETWEEN :startingTime::DATE AND :endingTime::DATE',
        {
          startingTime,
          endingTime,
        },
      );

    // Prepare visibility conditions
    const visibilityConditions = ['note.visibility = :everyone'];

    const visibilityParams: {
      everyone: string;
      delegators?: string;
      drepVoterId?: string;
      myself?: string;
      stakeKeyBech32?: string;
    } = {
      everyone: 'everyone',
    };

    // 'delegators' visibility
    if (delegation) {
      visibilityConditions.push(
        'note.visibility = :delegators AND signature.drep_bech32 = :drepVoterId',
      );
      visibilityParams.delegators = 'delegators';
      visibilityParams.drepVoterId = delegation.drep_view;
    }

    // 'myself' visibility
    if (stakeKeyBech32) {
      visibilityConditions.push(
        'note.visibility = :myself AND signature.stakeKey = :stakeKeyBech32',
      );
      visibilityParams.myself = 'myself';
      visibilityParams.stakeKeyBech32 = stakeKeyBech32;
    }

    // Combine visibility conditions with OR logic
    queryBuilder.andWhere(
      `(${visibilityConditions.join(' OR ')})`,
      visibilityParams,
    );

    return queryBuilder.getRawMany();
  }
}
