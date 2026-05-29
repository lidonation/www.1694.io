import { Module } from '@nestjs/common';
import { YaciStoreService } from './yaci-store.service';

@Module({
  providers: [YaciStoreService],
  exports: [YaciStoreService],
})
export class YaciStoreModule {}
