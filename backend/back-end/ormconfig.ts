import { Drep } from "src/entities/drep.entity";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

//sample config object
const config:PostgresConnectionOptions={
    type:'postgres',
    database:'postgres',
    host:'localhost',
    port:5432,
    username:'postgres',
    password:"0000",
    entities:[Drep],
    //Setting to true will update in real time for dev envt only. In prod, risks loss of data
    synchronize:true
}
export default config