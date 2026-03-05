import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MiscellaneousService } from './miscellaneous.service';

@Controller('misc')
export class MiscellaneousController {
  constructor(private miscService: MiscellaneousService) { }

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
  @Get('stake-addr/:address/payment')
  getRelatedPaymentAddrFromStakeAddr(@Param('address') address: string) {
    return this.miscService.getAddressesRelatedToStakeAddress(address);
  }
  @Get('/metrics')
  getMetrics() {
    return this.miscService.getMetrics();
  }

  @Get('/proposal/:hash/metadata')
  getProposal(@Param('hash') hash: string) {
    return this.miscService.getProposalMetadataByHash(hash);
  }

  @Get('metadata')
  getMetadata(@Query('url') url: string) {
    if (!url) return null;
    return this.miscService.fetchExternalMetadata(url);
  }
  @Post('submit-tx')
  submitTx(@Body('tx') tx: string) {
    return this.miscService.submitTx(tx);
  }
}
