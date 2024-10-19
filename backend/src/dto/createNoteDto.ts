import { IsNotEmpty, IsOptional } from 'class-validator';

export class createNoteDto {
  @IsNotEmpty()
  title: string;
  @IsOptional()
  note_tag: string[];
  @IsNotEmpty()
  content: string;
  @IsNotEmpty()
  stake_addr: string;
  @IsNotEmpty()
  drep: string;
  @IsNotEmpty()
  visibility: string;
  @IsOptional()
  attachments: string[];
}
