import {MSSQLServerContainer, StartedMSSQLServerContainer} from '@testcontainers/mssqlserver';
import {DataSource} from 'typeorm';
import {PipelineRun} from '../src/db/pipeline_run.entity';
import {PipelineRunOutput, PipelineRunOutputType} from '../src/db/pipeline_run_output.entity';
import {Pipeline} from '../src/db/pipeline.entity';
import JobOrchestratorService from '../src/services/JobOrchestratorService';
import {DataObject} from '../src/db/data_object.entity';
import {v4 as uuidv4} from 'uuid';
import {PipelineRunOutputController} from '../src/controllers/PipelineRunOutputController';
import PipelineRunOutputEntityService from '../src/services/PipelineRunOutputEntityService';
import {LinkedService} from '../src/db/linkedservice.entity';
import {Metadata} from '../src/db/metadata.entity';
import {PipelineRunLog} from '../src/db/pipeline_run_log.entity';
jest.mock('../src/services/JobOrchestratorService'); // Automatically mocks the module
describe('Pipelinerunoutput', () => {
  jest.setTimeout(600000);
  let run_id: string;

  let datasource: DataSource;
  let joborchestrator_service: JobOrchestratorService;
  let pipelinerunoutput_service: PipelineRunOutputEntityService;
  let pipelinerunoutput_controller: PipelineRunOutputController;
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
    joborchestrator_service = new JobOrchestratorService('', '');
    // Mock the method that is called within the controller
    run_id = uuidv4().toUpperCase();
    joborchestrator_service.createJobRun = jest.fn().mockResolvedValue({run_id: run_id});
    pipelinerunoutput_service = new PipelineRunOutputEntityService(datasource);
    pipelinerunoutput_controller = new PipelineRunOutputController(pipelinerunoutput_service);
  });

  afterAll(async () => {
    await datasource.destroy();
    await mssql_container.stop();
  });

  it('PipelineRunOutput should be created in SQL', async () => {
    const output = await pipelinerunoutput_controller.createPipelineRunOutput(uuidv4().toUpperCase(), PipelineRunOutputType.JSON, 'location', 'size');
    expect(output).not.toBeNull();
  });

  it('PipelineRunOutput should not be created in SQL (invalid run_id)', async () => {
    await expect(pipelinerunoutput_controller.createPipelineRunOutput('invalid', PipelineRunOutputType.JSON, '', '')).rejects.toThrow();
  });

  it('PipelineRunOutput should be retrieved from SQL', async () => {
    await pipelinerunoutput_controller.createPipelineRunOutput(run_id, PipelineRunOutputType.JSON, 'location', 'size');
    const output = await pipelinerunoutput_controller.getPipelineRunOutputByRunId(run_id);
    expect(output).not.toBeNull();
  });

  it('PipelineRunOutput should not be retrieved from SQL (non-existing run_id)', async () => {
    const output = await pipelinerunoutput_controller.getPipelineRunOutputByRunId(uuidv4());
    expect(output).toBeNull();
  });
});
