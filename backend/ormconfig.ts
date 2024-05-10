import { Attachment } from "src/entities/attachment.entity";
import { Comment } from "src/entities/comment.entity";
import { Delegator } from "src/entities/delegator.entity";
import { Drep  } from "src/entities/drep.entity";
import { Note } from "src/entities/note.entity";
import { Reaction } from "src/entities/reaction.entity";
import { PostgresConnectionOptions } from "typeorm/driver/postgres/PostgresConnectionOptions";

//sample config object
const configVoltaire: PostgresConnectionOptions = {
  type: "postgres",
  database: "1694",
  host: "web_db",
  port: 5432,
  username: "postgres",
  password: "postgres",
  entities: [Drep, Note,Attachment, Delegator, Comment, Reaction],
  //Setting to true will update in real time for dev envt only. In prod, risks loss of data
  synchronize: true,
};
const configCexplorer: PostgresConnectionOptions = {
  type: "postgres",
  database: "cexplorer",
  host: "dbsync_db",
  port: 5432,
  username: "postgres",
  password: "v8hlDV0yMAHHlIurYupj",
};
export {configVoltaire, configCexplorer}
