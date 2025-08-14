import PipelineEntityService from '../src/services/PipelineEntityService';
import {PipelineController} from '../src/controllers/PipelineController';
import KeyvaultService from '../src/services/KeyvaultService';
import {MSSQLServerContainer, StartedMSSQLServerContainer} from '@testcontainers/mssqlserver';
import {DataSource} from 'typeorm';
import {PipelineRun} from '../src/db/pipeline_run.entity';
import {PipelineRunOutput} from '../src/db/pipeline_run_output.entity';
import {Pipeline} from '../src/db/pipeline.entity';
import {DataObject} from '../src/db/data_object.entity';
import {v4 as uuidv4} from 'uuid';
import {LinkedService} from '../src/db/linkedservice.entity';
import LinkedServiceEntityService from '../src/services/LinkedServiceEntityService';
import {LinkedServiceController} from '../src/controllers/LinkedServiceController';
import {PipelinePrivacyLevel, PipelineState, PipelineType} from '../src/schemas/pipeline.entity';
import MetadataEntityService from '../src/services/MetadataEntityService';
import {MetadataSchema} from '../src/schemas/metadata.entity';
import {Metadata} from '../src/db/metadata.entity';
import {ConfigOracleSqlManagement, LinkedServiceType} from '../src/schemas/linkedservice.entity';
import {AzureSynapseService} from '../src/services/AzureSynapseService';
import {PipelineRunLog} from '../src/db/pipeline_run_log.entity';
jest.mock('../src/services/KeyvaultService'); // Automatically mocks the module

describe('Pipeline', () => {
  let linkedservice_id: string;
  const pipeline1 = {job_id: uuidv4(), name: 'test', cron: '* * * * *', parameters: {objects: []}};

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
  jest.setTimeout(600000);

  let datasource: DataSource;
  let keyvault_service: KeyvaultService;
  let pipeline_service: PipelineEntityService;
  let linkedservice_entity_service: LinkedServiceEntityService;
  let metadata_entity_service: MetadataEntityService;
  let azuresynapse_service: AzureSynapseService;
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
    keyvault_service = new KeyvaultService('', '', '');
    keyvault_service.getSecretValue = jest.fn().mockResolvedValue(undefined);
    keyvault_service.setSecret = jest.fn().mockResolvedValue({name: 'name', properties: {vaultUrl: `url/name`, name: 'name'}});
    pipeline_service = new PipelineEntityService(datasource);
    linkedservice_entity_service = new LinkedServiceEntityService(datasource);
    metadata_entity_service = new MetadataEntityService(datasource);
    azuresynapse_service = new AzureSynapseService('', '', '');
    pipeline_controller = new PipelineController(pipeline_service, keyvault_service, linkedservice_entity_service, metadata_entity_service);
    linkedservice_controller = new LinkedServiceController(linkedservice_entity_service, keyvault_service, pipeline_service, azuresynapse_service);

    const config: ConfigOracleSqlManagement = {host: 'host', port: 0, database: 'database', user: 'user', password: 'password'};
    const linkedservice = await linkedservice_controller.createLinkedService(LinkedServiceType.ORACLESQL, config);
    if (linkedservice) {
      linkedservice_id = linkedservice.linkedservice_id;
    }
  });

  afterAll(async () => {
    await datasource.destroy();
    await mssql_container.stop();
  });

  it('Pipeline should be inserted in SQL', async () => {
    const result = await pipeline_controller.createPipeline(pipeline1.job_id, pipeline1.name, 'description', null, null, PipelinePrivacyLevel.PUBLIC, pipeline1.cron, PipelineType.DATABASE_SYNCHRONIZATION, linkedservice_id, pipeline1.parameters, metadata, ['test']);
    expect(result.state).toEqual(PipelineState.ENABLED);
  });

  it('Pipeline should be retrieved from SQL', async () => {
    const result = await pipeline_controller.getPipelineByJobId(pipeline1.job_id);
    expect(result.length).toBeGreaterThan(0);
    expect(typeof result[0].pipeline_id).toEqual('string');
  });

  it('Pipeline should not be retrieved from SQL (non-existing job_id)', async () => {
    const result = await pipeline_controller.getPipelineByJobId(uuidv4());
    expect(result.length).toEqual(0);
  });

  // Additional tests
  it('Pipeline should be updated in SQL', async () => {
    const new_pipeline = await pipeline_controller.createPipeline(uuidv4(), 'new', 'description', null, null, PipelinePrivacyLevel.PUBLIC, '* * * * *', PipelineType.DATABASE_SYNCHRONIZATION, linkedservice_id, pipeline1.parameters, metadata, ['test']);
    const updatedPipeline = await pipeline_controller.updatePipeline(new_pipeline.pipeline_id, uuidv4(), PipelineState.DISABLED, PipelinePrivacyLevel.PUBLIC, 'updated', 'description', null, '* * * * *', linkedservice_id, pipeline1.parameters, metadata, ['test']);
    expect(updatedPipeline?.name).toEqual('updated');
  });

  it('Pipeline should be deleted from SQL', async () => {
    const new_pipeline = await pipeline_controller.createPipeline(uuidv4().toUpperCase(), 'new_tobedeleted', 'description', null, null, PipelinePrivacyLevel.PUBLIC, '* * * * *', PipelineType.DATABASE_SYNCHRONIZATION, linkedservice_id, pipeline1.parameters, metadata, ['test']);
    console.log(new_pipeline);
    const deleteResult = await pipeline_controller.deletePipeline(new_pipeline.pipeline_id);
    expect(typeof deleteResult).toBe('object');
  });

  it('Pipeline should not be deleted from SQL (non-existing job_id)', async () => {
    await expect(pipeline_controller.deletePipeline(uuidv4())).rejects.toThrow();
  });
});
