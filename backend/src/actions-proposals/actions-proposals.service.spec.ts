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

function buildService(cxUrl: string, http: { get: jest.Mock }) {
  return Test.createTestingModule({
    providers: [
      ActionsProposalsService,
      { provide: HttpService, useValue: http },
      {
        provide: ConfigService,
        useValue: {
          get: (k: string) =>
            k === 'PDF_BASE_URL'
              ? 'http://pdf'
              : k === 'METRICS_BASE_URL'
                ? cxUrl
                : cxUrl,
        },
      },
    ],
  }).compile();
}

describe('ActionsProposalsService upstream mapping (issues 226, 227)', () => {
  let http: { get: jest.Mock };

  beforeEach(() => {
    http = { get: jest.fn() };
  });

  test('findOne maps upstream 404 to 404', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    http.get.mockReturnValue(
      throwError(() => ({ response: { status: 404, data: 'nope' } })),
    );
    await expect(service.findOne('20')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  test('findOne maps DNS failure to 503, not bare 500', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    http.get.mockReturnValue(
      throwError(() => ({ code: 'ENOTFOUND', message: 'getaddrinfo' })),
    );
    await expect(service.findOne('20')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  test('findOne maps upstream 500 to 502', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    http.get.mockReturnValue(
      throwError(() => ({ response: { status: 500, data: 'bad' } })),
    );
    await expect(service.findOne('20')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  test('findOne preserves mapped status when upstream body is circular', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
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
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    http.get.mockReturnValue(
      throwError(() => ({ code: 'ENOTFOUND', message: 'dns' })),
    );
    await expect(service.findComments('20')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  test('findPoll maps upstream 404 to 404', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    http.get.mockReturnValue(
      throwError(() => ({ response: { status: 404, data: 'nope' } })),
    );
    await expect(service.findPoll('20')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  test('findOne passes through healthy data', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    http.get.mockReturnValue(of({ data: { data: { id: 20 } } }));
    await expect(service.findOne('20')).resolves.toEqual({ data: { id: 20 } });
  });

  test('findAll builds upstream URL from METRICS_BASE_URL with mapped sort field', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    http.get.mockReturnValue(of({ data: { data: [], total: 0 } }));
    await service.findAll({
      page: 2,
      pageSize: 12,
      sortBy: 'budget',
      sortOrder: 'desc',
    });
    expect(http.get).toHaveBeenCalledWith(
      'http://cx/cardano/budget-proposals',
      {
        params: expect.objectContaining({
          page: 2,
          limit: 12,
          sortBy: 'adaAmount',
          sortOrder: 'desc',
        }),
      },
    );
  });

  test.each([
    ['budget', 'adaAmount'],
    ['alphabetical', 'proposalName'],
    ['lastModified', 'updatedAt'],
    ['conversationRate', 'commentsCount'],
    ['updatedAt', 'updatedAt'],
    ['unknown-field', 'updatedAt'],
  ])('findAll maps sort option %s to %s', async (sortBy, expected) => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    http.get.mockReturnValue(of({ data: { data: [], total: 0 } }));
    await service.findAll({ sortBy });
    expect(http.get).toHaveBeenCalledWith(expect.any(String), {
      params: expect.objectContaining({ sortBy: expected }),
    });
  });

  test('findAll fails loudly when METRICS_BASE_URL is unset', async () => {
    const module: TestingModule = await buildService('', http);
    const service = module.get(ActionsProposalsService);
    await expect(service.findAll({})).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(http.get).not.toHaveBeenCalled();
  });

  test('getDatasetFreshness reports newest record age and stale flag', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    const fresh = new Date(Date.now() - 5 * 86400000).toISOString();
    http.get.mockReturnValue(of({ data: { data: [{ updatedAt: fresh }] } }));
    const result = await service.getDatasetFreshness(90);
    expect(result.newestUpdatedAt).toBe(fresh);
    expect(result.ageDays).toBeGreaterThanOrEqual(4);
    expect(result.stale).toBe(false);
    expect(result.thresholdDays).toBe(90);
  });

  test('getDatasetFreshness marks October 2025 snapshot stale', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    http.get.mockReturnValue(
      of({ data: { data: [{ updatedAt: '2025-10-15 09:20:16' }] } }),
    );
    const result = await service.getDatasetFreshness(90);
    expect(result.stale).toBe(true);
    expect(result.ageDays).toBeGreaterThan(90);
  });

  test('getDatasetFreshness treats invalid upstream date as stale', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    http.get.mockReturnValue(
      of({ data: { data: [{ updatedAt: 'not-a-date' }] } }),
    );
    await expect(service.getDatasetFreshness()).resolves.toEqual({
      newestUpdatedAt: null,
      ageDays: null,
      stale: true,
      thresholdDays: 90,
    });
  });

  test('getDatasetFreshness clamps future record age to 0', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    const future = new Date(Date.now() + 5 * 86400000).toISOString();
    http.get.mockReturnValue(of({ data: { data: [{ updatedAt: future }] } }));
    const result = await service.getDatasetFreshness(90);
    expect(result.ageDays).toBe(0);
    expect(result.stale).toBe(false);
  });

  test('getDatasetFreshness fails loudly when upstream unset', async () => {
    const module: TestingModule = await buildService('', http);
    const service = module.get(ActionsProposalsService);
    await expect(service.getDatasetFreshness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  test('getDatasetFreshness maps upstream failure to 503', async () => {
    const module: TestingModule = await buildService('http://cx', http);
    const service = module.get(ActionsProposalsService);
    http.get.mockReturnValue(
      throwError(() => ({ code: 'ENOTFOUND', message: 'dns' })),
    );
    await expect(service.getDatasetFreshness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
