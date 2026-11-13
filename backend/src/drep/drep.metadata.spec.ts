import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable, of } from 'rxjs';
import { IpfsService } from 'src/ipfs/ipfs.service';
import { DrepService } from './drep.service';

describe('DRep metadata upload', () => {
  it('sends the metadata bytes to IPFS as one multipart file', async () => {
    const post = jest
      .fn<Observable<unknown>, [string, unknown?]>()
      .mockReturnValue(
        of({ data: [{ cid: 'bafy', name: 'attachment', size: 9 }] }),
      );
    const ipfs = new IpfsService(
      new ConfigService({
        IPFS_CLUSTER_API_URL: 'http://cluster.test:9094',
        IPFS_CLUSTER_API_USER: 'voltaire',
        IPFS_CLUSTER_API_PASSWORD: 'password',
      }),
      { post } as unknown as HttpService,
    );
    const service = Object.assign(Object.create(DrepService.prototype), {
      ipfsService: ipfs,
    }) as DrepService;
    const metadata = { body: { givenName: 'Ada' } };

    await expect(service.saveMetadata(metadata)).resolves.toEqual({
      content: 'bafy',
      state: 'queued',
    });
    const body = post.mock.calls[0][1] as FormData;
    expect(await (body.get('file') as File).text()).toBe(
      JSON.stringify(metadata),
    );
  });
});
