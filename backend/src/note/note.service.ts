import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { AttachmentService } from 'src/attachment/attachment.service';
import { DrepService } from 'src/drep/drep.service';
import { createNoteDto } from 'src/dto';
import { DataSource } from 'typeorm';
@Injectable()
export class NoteService {
  constructor(
    @InjectDataSource('default')
    private voltaireService: DataSource,
    private drepService:DrepService,
    private attachmentService: AttachmentService,
  ) {}
  async getAllNotes() {
    return await this.voltaireService.getRepository('Note').find();
  }
  async getSingleNote(noteId: string) {
    const numifiedNoteId = Number(noteId);
    const note = await this.voltaireService.getRepository('Note').findOne({
      where: { id: numifiedNoteId },
    });
    if (!note) {
      throw new NotFoundException('Note not found!');
    }
    //if there are images in note content replace ids with src of base64, get
    // Extract image IDs from note_content
    const imgTagMatches = note.note_content.match(/<img id="(\d+)" \/>/g);
    if (imgTagMatches) {
      for (const imgTagMatch of imgTagMatches) {
        const idMatch = imgTagMatch.match(/id="(\d+)"/);
        if (idMatch && idMatch[1]) {
          const attachmentId = Number(idMatch[1]);
          const attachment =
            await this.attachmentService.getSingleAttachment(attachmentId);
          if (attachment) {
            const base64String = `data:image/${attachment.attachmentType};base64,${attachment.url}`;
            note.note_content = note.note_content.replace(
              imgTagMatch,
              `<img id="${idMatch[1]}" src="${base64String}" />`,
            );
          }
        }
      }
    }
    return note;
  }
  async registerNote(noteDto: createNoteDto) {
    const isPresent = await this.drepService.getSingleDrepViaVoterID(noteDto.voter);
    if (isPresent) {
      const modifiedNoteDto = { ...noteDto, voter: isPresent.drep_id };
      //get the note_content from the modifiedNoteDto
      // if any a tags or img tags are present, replace them with their respective ids
      if (modifiedNoteDto.note_content) {
        // get the img tags and anchor tags
        const imgTags = modifiedNoteDto.note_content.match(/<img[^>]+>/g);

        if (imgTags) {
          //first extract src and save as attchment
          // then get ids of attached and save in the stead of the base64s
          for (const imgTag of imgTags) {
            const srcMatch = imgTag.match(/src="([^">]+)"/);
            const matches = srcMatch[1].match(/^data:([^;]+);base64,(.+)$/);
            //get mimetype from base64 without the data: part
            const mimeType = matches[1];
            if (srcMatch && srcMatch[1]) {
              const base64Data = matches[2];
              const attachmentId =
                await this.attachmentService.insertAttachment(
                  base64Data,
                  mimeType,
                  modifiedNoteDto.voter,
                );
              modifiedNoteDto.note_content =
                modifiedNoteDto.note_content.replace(
                  imgTag,
                  `<img id="${attachmentId}" />`,
                );
            }
          }
        }
      }
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
    const isPresent = await this.drepService.getSingleDrepViaVoterID(note.voter);
    if (isPresent) {
      const modifiedNote = { ...note, voter: isPresent.drep_id };
      if (foundNote.note_content) {
        // Delete all existing attachments in the original content
        const oldImgTagMatches =
          foundNote.note_content.match(/<img id="(\d+)" \/>/g);
        if (oldImgTagMatches) {
          for (const oldImgTagMatch of oldImgTagMatches) {
            const idMatch = oldImgTagMatch.match(/id="(\d+)"/);
            if (idMatch && idMatch[1]) {
              const oldAttachmentId = Number(idMatch[1]);
              await this.attachmentService.deleteAttachment(oldAttachmentId);
            }
          }
        }
      }

      if (modifiedNote.note_content) {
        // Handle newly added images without IDs
        const newImgTags = modifiedNote.note_content.match(
          /<img[^>]+src="data:[^;]+;base64,([^">]+)"[^>]*>/g,
        );
        if (newImgTags) {
          for (const newImgTag of newImgTags) {
            const srcMatch = newImgTag.match(
              /src="data:([^;]+);base64,([^">]+)"/,
            );
            if (srcMatch && srcMatch[1] && srcMatch[2]) {
              const mimeType = srcMatch[1];
              const base64Data = srcMatch[2];
              const attachmentId =
                await this.attachmentService.insertAttachment(
                  base64Data,
                  mimeType,
                  modifiedNote.voter,
                );
              modifiedNote.note_content = modifiedNote.note_content.replace(
                newImgTag,
                `<img id="${attachmentId}" />`,
              );
            }
          }
        }
      }
      // Iterate through the properties of the note object
      Object.keys(modifiedNote).forEach((key) => {
        foundNote[key] = modifiedNote[key];
      });
      return await this.voltaireService.getRepository('Note').save(foundNote)
    } else {
      return new NotFoundException('DRep associated with note not found!');
    }
  }
}
