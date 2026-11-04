import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DrepModule } from '../drep/drep.module';
import { MiscellaneousModule } from '../miscellaneous/miscellaneous.module';
import { BlockfrostModule } from './blockfrost.module';
import { BlockfrostService } from './blockfrost.service';
import { RequestBudget } from './request-budget';

@Global()
@Module({
  providers: [
    {
      provide: getDataSourceToken(),
      useValue: {
        entityMetadatas: [],
        options: { type: 'postgres' },
        getRepository: () => ({}),
      },
    },
  ],
  exports: [getDataSourceToken()],
})
class TestDatabaseModule {}

describe('Cardano consumer module wiring', () => {
  it.each([MiscellaneousModule, DrepModule])(
    '%s resolves the shared Blockfrost service and its real request budget',
    async (consumer) => {
      const module = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
          HttpModule.register({ global: true }),
          TestDatabaseModule,
          BlockfrostModule,
          consumer,
        ],
      })
        // Unrelated repositories/guards need no external services. Never mock
        // RequestBudget: missing module visibility must fail as it does at boot.
        .useMocker((token) =>
          token === RequestBudget || token === BlockfrostService
            ? undefined
            : {},
        )
        .compile();
      try {
        const canonical = module
          .select(BlockfrostModule)
          .get(BlockfrostService, { strict: true });
        expect(module.get(BlockfrostService)).toBe(canonical);
        expect(
          module.select(BlockfrostModule).get(RequestBudget, { strict: true }),
        ).toBeInstanceOf(RequestBudget);
      } finally {
        await module.close();
      }
    },
  );
});
