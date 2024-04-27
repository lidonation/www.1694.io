import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DrepService } from './drep.service';
import { createDrepDto } from 'src/dto';

@Controller('dreps')
export class DrepController {
    constructor(private drepService:DrepService){}
    @Get('/cex')
    getAll(){
        return this.drepService.getAllDreps()
    }
    @Get('/vol')
    getAllVol(){
        return this.drepService.getAllDRepsVoltaire()
    }
    @Get('/migrate/vol')
    migrateVol(){
        return this.drepService.populateFakeDRepData()
    }
    @Get(':id/drep')
    getSingle(@Param('id') drepId:number){
        console.log(drepId)
        return this.drepService.getSingleDrep(drepId)
    }
    @Post('new')
    create(@Body() drepDto:createDrepDto){
        return this.drepService.registerDrep(drepDto)
    }
    @Post(':id/update')
    updateDetails(@Param('id') drepId:number, @Body() drep:createDrepDto){
        return this.drepService.updateDrepInfo(drepId,drep)
    }
}
