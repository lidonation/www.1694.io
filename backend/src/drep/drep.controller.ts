import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { DrepService } from './drep.service';
import { createDrepDto } from 'src/dto';

@Controller('dreps')
export class DrepController {
    constructor(private drepService:DrepService){}
    @Get('/cexplorer')
    getAll(){
        return this.drepService.getAllDrepsCexplorer()
    }
    @Get('/voltaire')
    getAllVol(){
        return this.drepService.getAllDRepsVoltaire()
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
