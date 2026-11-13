import { IpfsService } from 'src/ipfs/ipfs.service';
import { AttachmentRepository } from 'src/repository/voltaire/attachment.repository';
import { AttachmentService } from './attachment.service';

describe('AttachmentService IPFS upload', () => {
  it('relies on the upload pin instead of pinning a second time', async () => {
    const ipfs = {
      uploadAttachmentToIPFS: jest.fn().mockResolvedValue({
        ipfs_hash: 'bafy',
        name: 'file.txt',
        size: 5,
        state: 'queued',
      }),
      pinAttachmentToIPFS: jest.fn(),
    };
    const service = new AttachmentService(
      {} as AttachmentRepository,
      ipfs as unknown as IpfsService,
    );
    const form = new FormData();

    await expect(service.uploadAttachmentToIPFS(form)).resolves.toEqual({
      ipfs_hash: 'bafy',
      name: 'file.txt',
      size: 5,
      state: 'queued',
    });
    expect(ipfs.uploadAttachmentToIPFS).toHaveBeenCalledWith(form);
    expect(ipfs.pinAttachmentToIPFS).not.toHaveBeenCalled();
  });
});
