import { Injectable } from "@nestjs/common";
import { configCexplorer, configVoltaire } from "ormconfig";
import {DataSource} from "typeorm";


@Injectable()
export class ConnectionService{
    constructor (){}
    async addVoltaireConnection(){
        const volatireDS=new DataSource(configVoltaire)
        const initVol=await volatireDS.initialize()
        return initVol
    }
    async addCexplorerConnection(){
        const cexplorerDS=new DataSource(configCexplorer)
        const initCex=await cexplorerDS.initialize()
        return initCex
    }
}