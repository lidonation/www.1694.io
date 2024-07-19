import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { AttachmentService } from 'src/attachment/attachment.service';
import { CommentsService } from 'src/comments/comments.service';
import { DrepService } from 'src/drep/drep.service';
import { createNoteDto } from 'src/dto';
import { ReactionsService } from 'src/reactions/reactions.service';
import { DataSource } from 'typeorm';
@Injectable()
export class NoteService {
  constructor(
    @InjectDataSource('default')
    private voltaireService: DataSource,
    private drepService: DrepService,
    private attachmentService: AttachmentService,
    private reactionsService: ReactionsService,
    private commentsService: CommentsService
  ) {}
  async getAllNotes() {
    let allNotes = await this.voltaireService
      .getRepository('Note')
      .createQueryBuilder('note')
      .leftJoinAndSelect('drep', 'drep', 'drep.id = note.voterId')
      .getRawMany();
  
    // Used Promise.all to ensure all asynchronous operations complete
    allNotes = await Promise.all(allNotes.map(async (note) => {  
      // Get reactions and comments
      const reactions = await this.reactionsService.getReactions(note.note_id, 'note');
      const comments = await this.commentsService.getComments(note.note_id, 'note');
      // Add reactions and comments to the note
      return { ...note, reactions: reactions, comments: comments };
    }));
    return allNotes;
  }
  
  async getSingleNote(noteId: string) {
    const numifiedNoteId = Number(noteId);
    const note = await this.voltaireService.getRepository('Note').findOne({
      where: { id: numifiedNoteId },
    });
    if (!note) {
      throw new NotFoundException('Note not found!');
    }
    return note;
  }
  async registerNote(noteDto: createNoteDto) {
    const isPresent = await this.drepService.getSingleDrepViaVoterID(
      noteDto.voter,
    );
    if (isPresent) {
      const modifiedNoteDto = { ...noteDto, voter: isPresent.drep_id };
      const res = await this.voltaireService
        .getRepository('Note')
        .insert(modifiedNoteDto);
      return { noteAdded: res.identifiers[0].id };
    } else {
      return new NotFoundException('DRep associated with note not found!');
    }
  }
  async updateNoteInfo(noteId: string, note: createNoteDto) {
    const numifiedNoteId = Number(noteId);
    const foundNote = await this.voltaireService.getRepository('Note').findOne({
      where: { id: numifiedNoteId },
    });
    if (!foundNote) {
      throw new NotFoundException('Note to be updated not found!');
    }
    const isPresent = await this.drepService.getSingleDrepViaVoterID(
      note.voter,
    );
    if (isPresent) {
      const modifiedNote = { ...note, voter: isPresent.drep_id };
      // Iterate through the properties of the note object
      Object.keys(modifiedNote).forEach((key) => {
        foundNote[key] = modifiedNote[key];
      });
      return await this.voltaireService.getRepository('Note').save(foundNote);
    } else {
      return new NotFoundException('DRep associated with note not found!');
    }
  }
}
