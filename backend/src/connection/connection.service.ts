import { Injectable } from '@nestjs/common';
import { configCexplorer, configVoltaire } from 'ormconfig';
import { DataSource } from 'typeorm';

@Injectable()
export class ConnectionService {
  constructor() {}
  async addVoltaireConnection() {
    const volatireDS = new DataSource(configVoltaire);
    const initVoltaire = await volatireDS.initialize();
    return initVoltaire;
  }
  async addCexplorerConnection() {
    const cexplorerDS = new DataSource(configCexplorer);
    const initCexplorer = await cexplorerDS.initialize();
    return initCexplorer;
  }
}
