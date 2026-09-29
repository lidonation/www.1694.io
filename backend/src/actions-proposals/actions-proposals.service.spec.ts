import { Test, TestingModule } from '@nestjs/testing';
import { ActionsProposalsService } from './actions-proposals.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  BadGatewayException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('ActionsProposalsService upstream mapping (issue 227)', () => {
  let service: ActionsProposalsService;
  let http: { get: jest.Mock };

  beforeEach(async () => {
    http = { get: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionsProposalsService,
        { provide: HttpService, useValue: http },
        {
          provide: ConfigService,
          useValue: {
            get: (k: string) =>
              k === 'PDF_BASE_URL' ? 'http://pdf' : 'http://cx',
          },
        },
      ],
    }).compile();
    service = module.get(ActionsProposalsService);
  });

  test('findOne maps upstream 404 to 404', async () => {
    http.get.mockReturnValue(
      throwError(() => ({ response: { status: 404, data: 'nope' } })),
    );
    await expect(service.findOne('20')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  test('findOne maps DNS failure to 503, not bare 500', async () => {
    http.get.mockReturnValue(
      throwError(() => ({ code: 'ENOTFOUND', message: 'getaddrinfo' })),
    );
    await expect(service.findOne('20')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  test('findOne maps upstream 500 to 502', async () => {
    http.get.mockReturnValue(
      throwError(() => ({ response: { status: 500, data: 'bad' } })),
    );
    await expect(service.findOne('20')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  test('findOne preserves mapped status when upstream body is circular', async () => {
    const upstreamBody: Record<string, unknown> = {};
    upstreamBody.self = upstreamBody;
    http.get.mockReturnValue(
      throwError(() => ({ response: { status: 500, data: upstreamBody } })),
    );
    await expect(service.findOne('20')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  test('findComments maps connection failure to 503', async () => {
    http.get.mockReturnValue(
      throwError(() => ({ code: 'ENOTFOUND', message: 'dns' })),
    );
    await expect(service.findComments('20')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  test('findPoll maps upstream 404 to 404', async () => {
    http.get.mockReturnValue(
      throwError(() => ({ response: { status: 404, data: 'nope' } })),
    );
    await expect(service.findPoll('20')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  test('findOne passes through healthy data', async () => {
    http.get.mockReturnValue(of({ data: { data: { id: 20 } } }));
    await expect(service.findOne('20')).resolves.toEqual({ data: { id: 20 } });
  });
});
