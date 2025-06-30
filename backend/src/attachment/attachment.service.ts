import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Jimp, JimpMime } from 'jimp';
import {
  AttachmentParentEntityType,
  AttachmentTypeName,
} from 'src/entities/attachment.entity';
import { IPFSResponse } from 'src/common/types';
import { Response } from 'express';
import { AttachmentRepository } from 'src/repository/voltaire/attachment.repository';
import { IpfsService } from 'src/ipfs/ipfs.service';

@Injectable()
export class AttachmentService {
  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private ipfsService: IpfsService,
  ) {}
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
  parseJimpMimeType(mimeType: string) {
    switch (mimeType) {
      case 'image/png':
        return JimpMime.png;
      case 'image/jpg':
      case 'image/jpeg':
        return JimpMime.jpeg;
      case 'image/gif':
        return JimpMime.gif;
      default:
        return JimpMime.png;
    }
  }
  async parseImageSize(file: Express.Multer.File, mimeType: string) {
    try {
      const optimizedImageBuffer = await Jimp.read(file.buffer)
        .then((image) => {
          return image
            .resize({ w: 480, h: 480 })
            .getBuffer(this.parseJimpMimeType(mimeType));
        })
        .then((buffer) => {
          return buffer;
        });
      return { ...file, buffer: optimizedImageBuffer };
    } catch (error) {
      console.log(error);
    }
  }
  parseEntityType(entityType: string) {
    switch (entityType) {
      case 'drep':
        return AttachmentParentEntityType.DRep;
      case 'note':
        return AttachmentParentEntityType.Note;
      case 'comment':
        return AttachmentParentEntityType.Comment;
      default:
        return AttachmentParentEntityType.DRep;
    }
  }
  async insertAttachment(
    attachment: Express.Multer.File,
    mimeType: string,
    parentId: number,
    parentEntity: string,
  ) {
    try {
      const newAttachment = {
        url: attachment.buffer,
        name: attachment.originalname,
        parententity: this.parseEntityType(parentEntity),
        parentid: !String(parentId).includes('null') ? parentId : null,
        attachmentType: await this.parseMimeType(mimeType),
      };

      return await this.attachmentRepository.createAttachment(newAttachment);
    } catch (error) {
      //duplicate key value violates unique constraint
      if (error.code === '23505') {
        try {
          const existingAttachment = await this.attachmentRepository.findOne({
            where: {
              name: attachment.originalname,
            },
          });
          return existingAttachment;
        } catch (findError) {
          console.log('Error finding existing attachment:', findError);
          throw findError;
        }
      } else {
        console.log('Error inserting attachment:', error);
        throw error;
      }
    }
  }

  async getSingleAttachment(attachmentId: number) {
    try {
      return await this.attachmentRepository.findOneBy({
        id: attachmentId,
      });
    } catch (error) {
      console.log(error);
    }
  }
  async getSingleAttachmentByName(attachmentName: string) {
    try {
      return await this.attachmentRepository.findOneBy({
        name: attachmentName,
      });
    } catch (error) {
      console.log(error);
    }
  }
  async updateAttachment(
    attachment: any,
    attachmentId: number,
    mimeType: string,
    parentId: number,
    parentEntity: string,
  ) {
    try {
      const newAttachment = {
        url: attachment,
        parententity: this.parseEntityType(parentEntity),
        parentid: parentId,
        attachmentType: await this.parseMimeType(mimeType),
      };
      if (attachmentId) {
        await this.attachmentRepository.update(attachmentId, newAttachment);
      } else
        await this.insertAttachment(
          attachment,
          mimeType,
          parentId,
          parentEntity,
        );
      return true;
    } catch (error) {
      console.log(error);
    }
  }
  async deleteAttachment(attachmentId: number) {
    try {
      await this.attachmentRepository.delete(attachmentId);
      return true;
    } catch (error) {
      console.log(error);
    }
  }
  async uploadAttachmentToIPFS(
    attachment: Express.Multer.File | Buffer | Uint8Array | Blob | FormData,
  ): Promise<IPFSResponse> {
    try {
      const ipfsRes = await this.ipfsService.uploadAttachmentToIPFS(attachment);
      //then auto-pin the attachment
      const ipfsPinStatus = await this.ipfsService.pinAttachmentToIPFS(
        ipfsRes.ipfs_hash,
      );
      return {
        ...ipfsRes,
        state: ipfsPinStatus.state,
      };
    } catch (error) {
      console.error(error?.response?.data || error?.response || error);
      throw new HttpException(
        error?.response?.data || 'An error occured',
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAttachmentFromIPFS(hash: string, res: Response): Promise<any> {
    try {
      return await this.ipfsService.getAttachmentFromIPFS(hash, res);
    } catch (error) {
      console.error(error);
      throw new HttpException(
        error.response.statusText || 'An error occured',
        error.response.status,
      );
    }
  }
}
