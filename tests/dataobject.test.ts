import {MSSQLServerContainer, StartedMSSQLServerContainer} from '@testcontainers/mssqlserver';
import {DataSource} from 'typeorm';
import {PipelineRun} from '../src/db/pipeline_run.entity';
import {PipelineRunOutput} from '../src/db/pipeline_run_output.entity';
import {Pipeline} from '../src/db/pipeline.entity';
import JobOrchestratorService from '../src/services/JobOrchestratorService';
import {DataObject} from '../src/db/data_object.entity';
import DataObjectEntityService from '../src/services/DataObjectEntityService';
import {DataObjectController} from '../src/controllers/DataObjectController';

import {v4 as uuidv4} from 'uuid';
import {LinkedService} from '../src/db/linkedservice.entity';
import {Metadata} from '../src/db/metadata.entity';
import PipelineEntityService from '../src/services/PipelineEntityService';
import LinkedServiceEntityService from '../src/services/LinkedServiceEntityService';
import {MetadataSchema} from '../src/schemas/metadata.entity';
import {PipelineController} from '../src/controllers/PipelineController';
import {LinkedServiceController} from '../src/controllers/LinkedServiceController';
import {ConfigOracleSqlManagement, LinkedServiceType} from '../src/schemas/linkedservice.entity';
import {PipelinePrivacyLevel, PipelineType} from '../src/schemas/pipeline.entity';
import MetadataEntityService from '../src/services/MetadataEntityService';
import KeyvaultService from '../src/services/KeyvaultService';
import StorageService from '../src/services/StorageService';
import {AzureSynapseService} from '../src/services/AzureSynapseService';
import {PipelineRunLog} from '../src/db/pipeline_run_log.entity';
jest.mock('../src/services/JobOrchestratorService'); // Automatically mocks the module
describe('Data Object', () => {
  jest.setTimeout(600000);
  let pipeline_id: string;
  const job_id: string = uuidv4().toUpperCase();
  const data_objects_correct = [{origin_name: 'origin_schema.origin_table', destination_name: 'destination_schema.destination_table'}];
  const random_string: string = 'random';

  let datasource: DataSource;
  let storage_service: StorageService;
  let joborchestrator_service: JobOrchestratorService;
  let dataobject_service: DataObjectEntityService;
  let pipeline_service: PipelineEntityService;
  let linkedservice_entity_service: LinkedServiceEntityService;
  let metadata_entity_service: MetadataEntityService;
  let keyvault_service: KeyvaultService;
  let azuresynapse_service: AzureSynapseService;
  let linkedservice_controller: LinkedServiceController;
  let pipeline_controller: PipelineController;
  let dataobject_controller: DataObjectController;
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
    joborchestrator_service.createJobRun = jest.fn().mockResolvedValue({run_id: uuidv4()});
    keyvault_service = new KeyvaultService('', '', '');
    keyvault_service.getSecretValue = jest.fn().mockResolvedValue(undefined);
    keyvault_service.setSecret = jest.fn().mockResolvedValue({name: 'name', properties: {vaultUrl: `url/name`, name: 'name'}});
    storage_service = new StorageService(uuidv4().toUpperCase());
    dataobject_service = new DataObjectEntityService(datasource);
    pipeline_service = new PipelineEntityService(datasource);
    linkedservice_entity_service = new LinkedServiceEntityService(datasource);
    metadata_entity_service = new MetadataEntityService(datasource);
    dataobject_controller = new DataObjectController(dataobject_service, pipeline_service, metadata_entity_service, storage_service, '', '');
    azuresynapse_service = new AzureSynapseService('', '', '');
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
      const pipeline = await pipeline_controller.createPipeline(
        job_id,
        'name',
        'description',
        null,
        null,
        PipelinePrivacyLevel.PUBLIC,
        '* * * * *',
        PipelineType.DATABASE_SYNCHRONIZATION,
        linkedservice?.linkedservice_id,
        {
          objects: [
            {
              type: 'table',
              origin_schema_name: data_objects_correct[0].origin_name.split('.')[0],
              origin_object_name: data_objects_correct[0].origin_name.split('.')[1],
              destination_schema_name: data_objects_correct[0].destination_name.split('.')[0],
              destination_object_name: data_objects_correct[0].destination_name.split('.')[1],
            },
          ],
        },
        metadata,
        ['test'],
      );
      pipeline_id = pipeline.pipeline_id;
    }
  });

  afterAll(async () => {
    await datasource.destroy();
    await mssql_container.stop();
  });

  it('DataObjects should be created', async () => {
    const data_objects = await dataobject_controller.createPipelineDataObjects(pipeline_id, data_objects_correct, ['test']);
    expect(Array.isArray(data_objects)).toBe(true);
    expect(data_objects.length).toBeGreaterThan(0);
  });

  it('DataObject should not be created (pipeline_id not guid)', async () => {
    await expect(dataobject_controller.createPipelineDataObjects(random_string, data_objects_correct, ['test'])).rejects.toThrow();
  });

  it('Check origin should return true', async () => {
    const origin_check = await dataobject_controller.checkOrigin(data_objects_correct[0].origin_name, undefined);
    expect(origin_check).toBe(true);
  });

  it('Check origin should return false', async () => {
    const origin_check = await dataobject_controller.checkOrigin(data_objects_correct[0].origin_name, pipeline_id);
    expect(origin_check).toBe(false);
  });

  it('Check destination should return true', async () => {
    const destination_check = await dataobject_controller.checkDestination(data_objects_correct[0].destination_name, undefined);
    expect(destination_check).toBe(true);
  });

  it('Check destination should return false', async () => {
    const destination_check = await dataobject_controller.checkDestination(data_objects_correct[0].destination_name, pipeline_id);
    expect(destination_check).toBe(false);
  });
});
