import { Injectable } from '@nestjs/common';
import { ConnectionService } from 'src/connection/connection.service';
import {
  AttachmentParentEntityType,
  AttachmentTypeName,
} from 'src/entities/attachment.entity';

@Injectable()
export class AttachmentService {
  constructor(private connectionService: ConnectionService) {}
  async parseMimeType(mimeType: string) {
    switch (mimeType) {
      case 'image/png':
        return AttachmentTypeName.PNG;
      case 'image/jpg':
        return AttachmentTypeName.JPG;
      case 'image/jpeg':
        return AttachmentTypeName.JPG;
      case 'image/gif':
        return AttachmentTypeName.GIF;
      case 'image/svg':
        return AttachmentTypeName.SVG;
      case 'image/svg+xml':
        return AttachmentTypeName.SVG;
      case 'image/webp':
        return AttachmentTypeName.WEBP;
      case 'application/pdf':
        return AttachmentTypeName.PDF;
      default:
        return AttachmentTypeName.Link;
    }
  }
  async parseBufferToBase64(buffer: Buffer, mimeType: string) {
    const raw = Buffer.from(buffer).toString('base64');
    const url = `data:image/${mimeType};base64,${raw}`;
    return url;
  }
  async insertAttachment(attachment: any, mimeType: string, parentId: number) {
    try {
      const queryInstance =
        await this.connectionService.addVoltaireConnection();
      const newAttachment = {
        url: attachment,
        parententity: AttachmentParentEntityType.DRep,
        parentid: parentId,
        attachmentType: await this.parseMimeType(mimeType),
      };
      await queryInstance.getRepository('Attachment').insert(newAttachment);
      return true;
    } catch (error) {
      console.log(error);
    }
  }
  async updateAttachment(
    attachment: any,
    attachmentId: number,
    mimeType: string,
    parentId: number,
  ) {
    try {
      const queryInstance =
        await this.connectionService.addVoltaireConnection();
      const newAttachment = {
        url: attachment,
        parententity: AttachmentParentEntityType.DRep,
        parentid: parentId,
        attachmentType: await this.parseMimeType(mimeType),
      };
      await queryInstance
        .getRepository('Attachment')
        .update(attachmentId, newAttachment);
      return true;
    } catch (error) {
      console.log(error);
    }
  }
}
