import {MSSQLServerContainer, StartedMSSQLServerContainer} from '@testcontainers/mssqlserver';
import {DataSource} from 'typeorm';
import {SqlValidationController} from '../src/controllers/SqlValidationController';
import {PipelineRun} from '../src/db/pipeline_run.entity';
import {PipelineRunOutput} from '../src/db/pipeline_run_output.entity';
import {Pipeline} from '../src/db/pipeline.entity';
import {DataObject} from '../src/db/data_object.entity';
import {LinkedService} from '../src/db/linkedservice.entity';
import {Metadata} from '../src/db/metadata.entity';
import {PipelineRunLog} from '../src/db/pipeline_run_log.entity';

describe('Query_validation', () => {
  jest.setTimeout(600000);
  let datasource: DataSource;
  let sqlvalidation_controller: SqlValidationController;
  let mssql_container: StartedMSSQLServerContainer;

  beforeAll(async () => {
    mssql_container = await new MSSQLServerContainer('mcr.microsoft.com/mssql/server:2022-latest').acceptLicense().start();
    datasource = new DataSource({
      type: 'mssql',
      host: mssql_container.getHost(),
      database: mssql_container.getDatabase(),
      username: mssql_container.getUsername(),
      password: mssql_container.getPassword(),
      options: {encrypt: false},
      extra: {
        validateConnection: false,
        trustServerCertificate: true,
        ssl: false,
      },
      port: mssql_container.getPort(),
      entities: [Pipeline, PipelineRun, PipelineRunLog, PipelineRunOutput, LinkedService, DataObject, Metadata],
      migrationsRun: true,
      migrations: ['./build/db/migrations/*.js'],
      schema: 'dbo',
      logging: ['schema', 'migration', 'warn', 'error'],
      synchronize: false, //! NEVER SET THIS TO TRUE
    });

    await datasource.initialize();
    console.log(`Initialized datasource`);
    await datasource.runMigrations();
    console.log(`Run migrations datasource`);
    sqlvalidation_controller = new SqlValidationController(datasource.manager);
  });

  afterAll(async () => {
    await datasource.destroy();
    //await mssql_container.stop();
  });

  it('Query validation should be false (table in query does not exists)', async () => {
    const result = await sqlvalidation_controller.validateSql('select * from non-existent');
    expect(result.valid).toEqual(false);
  });

  it('Query validation should be true (table in query exists)', async () => {
    const result = await sqlvalidation_controller.validateSql('select * from pipelines');
    expect(result.valid).toEqual(true);
  });

  it('Query validation should be false (ambiguos column)', async () => {
    const result = await sqlvalidation_controller.validateSql('SELECT * FROM [dbo].[pipeline_runs] a JOIN [dbo].[pipelines] b ON a.pipeline_id = b.pipeline_id');
    expect(result.valid).toEqual(false);
  });

  it('Query validation should be true (named column)', async () => {
    const result = await sqlvalidation_controller.validateSql('SELECT a.pipeline_id FROM [dbo].[pipeline_runs] a JOIN [dbo].[pipelines] b ON a.pipeline_id = b.pipeline_id');
    expect(result.valid).toEqual(true);
  });
});
