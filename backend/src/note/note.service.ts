import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createNoteDto } from "src/dto";
import { DataSource, Repository } from "typeorm";
import { ConnectionService } from "src/connection/connection.service";
import { Note } from "src/entities/note.entity";

@Injectable()
export class NoteService {
  constructor(
    @InjectRepository(Note) private noteRepo: Repository<Note>,
    private connectionService: ConnectionService
  ) {}

  async initializeQueryRunner() {
    const queryInstance = await this.connectionService.addVoltaireConnection();
    return queryInstance;
  }
  async getAllNotes() {
    return await this.noteRepo.find();
  }
  async getSingleNote(noteId: string) {
    const numifiedNoteId = Number(noteId);
    const noteList = await this.noteRepo.findOne({
      where: { id: numifiedNoteId },
    });
    if (!noteList) {
      throw new NotFoundException("Note not found!");
    }
    return noteList;
  }
  async registerNote(noteDto: createNoteDto) {
    const queryInstance = await this.initializeQueryRunner();
    const isPresent = await queryInstance
      .getRepository("Drep")
      .findOneBy({ voter_id: noteDto.voter });
    if (isPresent) {
      const modifiedNoteDto = { ...noteDto, voter: isPresent.id };
      const res = await queryInstance
        .getRepository("Note")
        .insert(modifiedNoteDto);
      console.log(res.identifiers[0].id);
      return { noteAdded: res.identifiers[0].id };
    } else {
      return new NotFoundException("DRep associated with note not found!");
    }
  }
  async updateNoteInfo(noteId: string, note: createNoteDto) {
    const numifiedNoteId = Number(noteId);
    const foundNote = await this.noteRepo.findOne({
      where: { id: numifiedNoteId },
    });
    if (!foundNote) {
      throw new NotFoundException("Note to be updated not found!");
    }
    const queryInstance = await this.initializeQueryRunner();
    const isPresent = await queryInstance
      .getRepository("Drep")
      .findOneBy({ voter_id: note.voter });
    if (isPresent) {
      const modifiedNote = { ...note, voter: isPresent.id };
      // Iterate through the properties of the note object
      Object.keys(modifiedNote).forEach((key) => {
        foundNote[key] = modifiedNote[key];
      });
      return await this.noteRepo.save(foundNote);
    } else {
      return new NotFoundException("DRep associated with note not found!");
    }
  }
}
