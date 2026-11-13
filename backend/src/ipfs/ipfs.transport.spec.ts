import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { AddressInfo } from 'node:net';
import { IpfsService } from './ipfs.service';

const cid = 'bafkreigh2akiscaildc3hkgzw7jvpr3ovbgatw3vqv4kxiloj5xatbdp7y';

describe('IPFS HTTP transport', () => {
  it.each([200, 401, 503, 307])(
    'preserves multipart bytes and isolates authentication when cluster returns %s',
    async (status) => {
      const calls: Array<{
        path: string;
        auth?: string;
        project?: string;
        body: Buffer;
        contentType?: string;
      }> = [];
      const server = createServer((request, response) => {
        void handle(request, response).catch(() => {
          response.writeHead(500).end();
        });
      });
      async function handle(
        request: IncomingMessage,
        response: ServerResponse,
      ) {
        const chunks: Buffer[] = [];
        for await (const chunk of request)
          chunks.push(Buffer.from(chunk as Uint8Array));
        const path = request.url || '';
        calls.push({
          path,
          auth: request.headers.authorization,
          project: request.headers.project_id as string,
          body: Buffer.concat(chunks),
          contentType: request.headers['content-type'],
        });
        response.setHeader('Content-Type', 'application/json');
        if (path.startsWith('/add')) {
          if (status === 307)
            response.setHeader('Location', '/credential-sink');
          response
            .writeHead(status)
            .end(
              JSON.stringify(
                status === 200
                  ? [{ cid, name: 'binary.dat', size: 5 }]
                  : { error: 'unavailable' },
              ),
            );
        } else if (path === '/bf/ipfs/add') {
          response.end(
            JSON.stringify({ ipfs_hash: cid, name: 'binary.dat', size: 5 }),
          );
        } else if (path.startsWith('/pins/')) {
          response.writeHead(202).end('{}');
        } else response.writeHead(404).end('{}');
      }
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      await new Promise<void>((resolve) =>
        server.listen(0, '127.0.0.1', resolve),
      );
      try {
        const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        const service = new IpfsService(
          new ConfigService({
            IPFS_CLUSTER_API_URL: url,
            IPFS_CLUSTER_API_USER: 'voltaire',
            IPFS_CLUSTER_API_PASSWORD: 'test-password',
            BLOCKFROST_IPFS_URL: `${url}/bf`,
            BLOCKFROST_IPFS_PROJECT_ID: 'bf-key',
          }),
          new HttpService(axios.create({ proxy: false })),
        );
        const bytes = new Uint8Array([0, 1, 255, 65, 10]);
        const form = new FormData();
        form.append('attachment', new Blob([bytes]), 'binary.dat');
        expect(await service.uploadAttachmentToIPFS(form)).toEqual({
          ipfs_hash: cid,
          name: 'binary.dat',
          size: 5,
          state: 'queued',
        });
        expect(calls[0].auth).toBe(
          `Basic ${Buffer.from('voltaire:test-password').toString('base64')}`,
        );
        expect(calls[0].project).toBeUndefined();
        const multipart = await new globalThis.Response(calls[0].body, {
          headers: { 'content-type': calls[0].contentType || '' },
        }).formData();
        const file = multipart.get('file') as File;
        expect(file.name).toBe('binary.dat');
        expect(Buffer.from(await file.arrayBuffer())).toEqual(
          Buffer.from(bytes),
        );
        expect(calls.some((call) => call.path === '/credential-sink')).toBe(
          false,
        );
        if (status !== 200) {
          expect(calls[1].path).toBe('/bf/ipfs/add');
          expect(calls[1].auth).toBeUndefined();
          expect(calls[1].project).toBe('bf-key');
          const fallbackForm = await new globalThis.Response(calls[1].body, {
            headers: { 'content-type': calls[1].contentType || '' },
          }).formData();
          expect(
            Buffer.from(await (fallbackForm.get('file') as File).arrayBuffer()),
          ).toEqual(Buffer.from(bytes));
        }
      } finally {
        warn.mockRestore();
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
      }
    },
  );
});
