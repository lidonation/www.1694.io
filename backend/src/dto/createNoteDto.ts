import { IsNotEmpty, IsOptional } from 'class-validator';
import {Type} from 'class-transformer'

export class createNoteDto {
  @IsNotEmpty()
  note_title: string;
  @IsOptional()
  note_tag: string[];
  @IsNotEmpty()
  note_content: string;
  @IsNotEmpty()
  stake_addr: string;
  @IsNotEmpty()
  drep: string;
  //@IsNotEmpty()
  author: string;
  @IsNotEmpty()
  note_visibility: string;
  @IsOptional()
  attachments: string[];
}
