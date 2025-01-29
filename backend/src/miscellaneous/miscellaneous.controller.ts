import { Controller, Get, Param } from '@nestjs/common';
import { MiscellaneousService } from './miscellaneous.service';

@Controller('misc')
export class MiscellaneousController {
  constructor(private miscService: MiscellaneousService) {}

  @Get('epochs/first')
  getFirstEpoch() {
    return this.miscService.getFirstEpoch();
  }

  @Get('tx/:hash/exists')
  getTx(@Param('hash') hash: string) {
    return this.miscService.checkTxExists(hash);
  }

  @Get('address/:address/utxos')
  getAddressUtxos(@Param('address') address: string) {
    return this.miscService.getAddressUtxos(address);
  }
  @Get('node/status')
  getNodeStatus() {
    return this.miscService.getNodeStatus();
  }
  @Get('/metrics')
  getMetrics() {
    return this.miscService.getMetrics();
  }
}
