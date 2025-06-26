import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CommentsService } from 'src/comments/comments.service';
import { Delegation } from 'src/common/types';
import { createNoteDto } from 'src/dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ReactionsService } from 'src/reactions/reactions.service';
import { DRepRepository } from 'src/repository/voltaire/dRep.repository';
import { NoteRepository } from 'src/repository/voltaire/note.repository';
import { SignatureRepository } from 'src/repository/voltaire/signature.repository';

@Injectable()
export class NoteService {
  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly signatureRepository: SignatureRepository,
    private readonly drepRepository: DRepRepository,
    private readonly reactionsService: ReactionsService,
    private readonly commentsService: CommentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getAllNotes(
    stakeKeyBech32?: string,
    delegation?: Delegation,
    currentNote?: number,
    request?: string,
  ) {
    let allNotes = await this.noteRepository.getNotesWithVisibility(
      delegation,
      stakeKeyBech32,
      currentNote,
      request,
    );

    // Used Promise.all to ensure all asynchronous operations complete
    allNotes = await Promise.all(
      allNotes.map(async (note) => {
        // Get reactions and comments
        const reactions = await this.reactionsService.getReactions(
          note.note_id,
          'note',
        );
        const comments = await this.commentsService.getComments(
          note.note_id,
          'note',
        );
        // Add reactions and comments to the note
        return { ...note, reactions: reactions, comments: comments };
      }),
    );

    return allNotes;
  }

  async getSingleNote(noteId: string) {
    const numifiedNoteId = Number(noteId);
    const note = await this.noteRepository.findById(numifiedNoteId);
    if (!note) {
      throw new NotFoundException('Note not found!');
    }
    const reactions = await this.reactionsService.getReactions(note.id, 'note');
    const comments = await this.commentsService.getComments(note.id, 'note');
    return { ...note, reactions: reactions, comments: comments };
  }

  async registerNote(noteDto: createNoteDto) {
    try {
      const isDRepPresent = await this.drepRepository.getSingleDrepViaVoterID(
        noteDto.drep,
      );
      const author = await this.signatureRepository.findByStakeKey(
        noteDto.stake_addr,
      );
      if (!author) {
        throw new NotFoundException('Author details not found!');
      }
      const modifiedNoteDto = {
        ...noteDto,
        drep: isDRepPresent.drep_id,
      };
      const res = await this.noteRepository.createNote(modifiedNoteDto);

      if (isDRepPresent && noteDto.visibility !== 'myself') {
        await this.notificationsService.processNewNoteNotificationsForDelegators(
          isDRepPresent.view,
          new Date(),
        );
      }
      return { noteAdded: res?.id, message: 'Note added successfully!' };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        (error?.code == 23505 && 'Duplicate Note found') ||
          error?.message ||
          error?.status ||
          'An error occured',
        (error?.code == 23505 && 409) || 500,
      );
    }
  }

  async updateNoteInfo(noteId: string, note: createNoteDto) {
    const numifiedNoteId = Number(noteId);
    const foundNote = await this.noteRepository.findById(numifiedNoteId);
    if (!foundNote) {
      throw new NotFoundException('Note to be updated not found!');
    }
    const isPresent = await this.drepRepository.getSingleDrepViaVoterID(
      note.drep,
    );
    if (isPresent) {
      const modifiedNote = { ...note, drep: isPresent.drep_id };
      // Iterate through the properties of the note object
      Object.keys(modifiedNote).forEach((key) => {
        foundNote[key] = modifiedNote[key];
      });
      return await this.noteRepository.save(foundNote);
    } else {
      return new NotFoundException('DRep associated with note not found!');
    }
  }
}
