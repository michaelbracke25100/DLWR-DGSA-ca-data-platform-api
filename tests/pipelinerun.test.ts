import PipelineEntityService from '../src/services/PipelineEntityService';
import {MSSQLServerContainer, StartedMSSQLServerContainer} from '@testcontainers/mssqlserver';
import {DataSource} from 'typeorm';
import {PipelineRun} from '../src/db/pipeline_run.entity';
import {PipelineRunOutput} from '../src/db/pipeline_run_output.entity';
import {Pipeline} from '../src/db/pipeline.entity';
import {PipelineRunController} from '../src/controllers/PipelineRunController';
import PipelineRunEntityService from '../src/services/PipelineRunEntityService';
import JobOrchestratorService from '../src/services/JobOrchestratorService';
import {DataObject} from '../src/db/data_object.entity';
import {Metadata} from '../src/db/metadata.entity';
import {v4 as uuidv4} from 'uuid';
import {LinkedService} from '../src/db/linkedservice.entity';
import {PipelineController} from '../src/controllers/PipelineController';
import KeyvaultService from '../src/services/KeyvaultService';
import LinkedServiceEntityService from '../src/services/LinkedServiceEntityService';
import {LinkedServiceController} from '../src/controllers/LinkedServiceController';
import MetadataEntityService from '../src/services/MetadataEntityService';
import {MetadataSchema} from '../src/schemas/metadata.entity';
import {PipelineRunState} from '../src/schemas/pipeline_run.entity';
import {ConfigOracleSqlManagement, LinkedServiceType} from '../src/schemas/linkedservice.entity';
import {PipelinePrivacyLevel, PipelineType} from '../src/schemas/pipeline.entity';
import {AzureSynapseService} from '../src/services/AzureSynapseService';
import PipelineRunLogEntityService from '../src/services/PipelineRunLogEntityService';
import {PipelineRunLog} from '../src/db/pipeline_run_log.entity';
jest.mock('../src/services/JobOrchestratorService'); // Automatically mocks the module
jest.mock('../src/services/KeyvaultService'); // Automatically mocks the module
describe('Pipelinerun', () => {
  jest.setTimeout(600000);
  const oracle_job_id: string = uuidv4().toUpperCase();
  const transform_job_id: string = uuidv4().toUpperCase();
  let pipeline_id: string;
  let run_id: string;

  let datasource: DataSource;
  let keyvault_service: KeyvaultService;
  let joborchestrator_service: JobOrchestratorService;
  let linkedservice_entity_service: LinkedServiceEntityService;
  let metadata_entity_service: MetadataEntityService;
  let pipeline_service: PipelineEntityService;
  let pipelinerun_service: PipelineRunEntityService;
  let pipelinerunlog_service: PipelineRunLogEntityService;
  let azuresynapse_service: AzureSynapseService;
  let pipelinerun_controller: PipelineRunController;
  let pipeline_controller: PipelineController;
  let linkedservice_controller: LinkedServiceController;
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
    joborchestrator_service.createJobRun = jest.fn().mockResolvedValue({run_id: uuidv4().toUpperCase()});
    keyvault_service = new KeyvaultService('', '', '');
    keyvault_service.getSecretValue = jest.fn().mockResolvedValue(undefined);
    keyvault_service.setSecret = jest.fn().mockResolvedValue({name: 'name', properties: {vaultUrl: `url/name`, name: 'name'}});
    linkedservice_entity_service = new LinkedServiceEntityService(datasource);
    metadata_entity_service = new MetadataEntityService(datasource);
    pipeline_service = new PipelineEntityService(datasource);
    pipelinerun_service = new PipelineRunEntityService(datasource);
    pipelinerunlog_service = new PipelineRunLogEntityService(datasource);
    azuresynapse_service = new AzureSynapseService('', '', '');
    pipelinerun_controller = new PipelineRunController(pipeline_service, pipelinerun_service, pipelinerunlog_service, joborchestrator_service, linkedservice_entity_service, oracle_job_id, transform_job_id);
    pipeline_controller = new PipelineController(pipeline_service, keyvault_service, linkedservice_entity_service, metadata_entity_service);
    linkedservice_controller = new LinkedServiceController(linkedservice_entity_service, keyvault_service, pipeline_service, azuresynapse_service);

    const config: ConfigOracleSqlManagement = {host: 'host', port: 0, database: 'database', user: 'user', password: 'password'};
    const linkedservice = await linkedservice_controller.createLinkedService(LinkedServiceType.ORACLESQL, config);
    const metadata: MetadataSchema = {
      business_unit: 'business_unit',
      eurovoc_subjects: 'eurovoc_subjects',
      it_solution: 'it_solution',
      business_data_owner: 'business_data_owner',
      business_data_steward: 'business_data_steward',
      domain: 'domain',
      sub_domain: 'sub_domain',
      technical_data_steward: 'technical_data_steward',
    };
    if (linkedservice) {
      const pipeline = await pipeline_controller.createPipeline(oracle_job_id, 'name', 'description', null, null, PipelinePrivacyLevel.PUBLIC, '* * * * *', PipelineType.DATABASE_SYNCHRONIZATION, linkedservice?.linkedservice_id, {objects: []}, metadata, ['test']);
      pipeline_id = pipeline.pipeline_id;
    }
  });

  afterAll(async () => {
    await datasource.destroy();
    await mssql_container.stop();
  });

  it('PipelineRun should be created in SQL', async () => {
    const result = await pipelinerun_controller.createPipelineRun(pipeline_id, {user_id: 'test', name: 'test'});
    if (result) {
      run_id = result.run_id;
    }
    expect(result?.state).toEqual(PipelineRunState.REQUESTED);
  });

  it('PipelineRun should not be created in SQL (invalid pipeline_id)', async () => {
    await expect(pipelinerun_controller.createPipelineRun(pipeline_id + 'wrong', {user_id: 'test', name: 'test'})).rejects.toThrow();
  });

  it('PipelineRun should be retrieved from SQL', async () => {
    const result = await pipelinerun_controller.getPipelineRunById(run_id);
    expect(result?.pipeline_id).toEqual(pipeline_id);
  });

  it('PipelineRun should not be retrieved from SQL (non-existing run_id)', async () => {
    const result = await pipelinerun_controller.getPipelineRunById(uuidv4());
    expect(result).toBeNull();
  });
  it('PipelineRun state should be updated in SQL', async () => {
    const updatedRun = await pipelinerun_controller.updatePipelineRunState(run_id, PipelineRunState.SUCCESSFUL);
    expect(updatedRun?.state).toEqual(PipelineRunState.SUCCESSFUL);
  });
});
