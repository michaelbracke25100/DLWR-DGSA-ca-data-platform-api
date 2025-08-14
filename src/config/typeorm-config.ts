import { DataSource } from 'typeorm';
import { Pipeline } from '../db/pipeline.entity';
import { PipelineRun } from '../db/pipeline_run.entity';
import { PipelineRunOutput } from '../db/pipeline_run_output.entity';
import { getConfig } from './config';
import { DataObject } from '../db/data_object.entity';
import { LinkedService } from '../db/linkedservice.entity';
import { Metadata } from '../db/metadata.entity';
import { PipelineRunLog } from '../db/pipeline_run_log.entity';

const datasource = new DataSource({
  type: 'mssql',
  host: getConfig().SQL_HOST,
  database: getConfig().SQL_DATABASE,
  ...(!getConfig().ENV.includes('LOCAL')
    ? {
      authentication: {
        type: 'azure-active-directory-default',
        options: {
          clientId: getConfig().ID_CLIENTID,
        },
      },
      options: { encrypt: true },
      extra: {
        ssl: true,
      },
    }
    : {
      username: 'sa',
      password: 'S3CRETS3CREt1',
      options: { encrypt: false },
      extra: {
        ssl: false,
      },
    }),
  port: 1433,
  entities: [Pipeline, PipelineRun, PipelineRunLog, PipelineRunOutput, LinkedService, DataObject, Metadata],
  migrationsRun: true,
  migrations: ['./build/db/migrations/*.js'],
  schema: 'dbo',
  logging: ['schema', 'migration', 'warn', 'error'],
  synchronize: false, //! NEVER SET THIS TO TRUE
});

export async function close_db_connection(): Promise<void> {
  try {
    await datasource.destroy();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

export default datasource;
