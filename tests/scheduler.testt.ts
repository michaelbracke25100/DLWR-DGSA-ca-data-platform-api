// import PipelineEntityService from '../src/services/PipelineEntityService';
// import {PipelineController} from '../src/controllers/PipelineController';
// import KeyvaultService from '../src/services/KeyvaultService';
// import {MSSQLServerContainer, StartedMSSQLServerContainer} from '@testcontainers/mssqlserver';
// import {DataSource} from 'typeorm';
// import {PipelineRun, PipelineRunState} from '../src/db/pipeline_run.entity';
// import {PipelineRunOutput} from '../src/db/pipeline_run_output.entity';
// import {Pipeline} from '../src/db/pipeline.entity';
// import {PipelineRunController} from '../src/controllers/PipelineRunController';
// import {DataObject} from '../src/db/data_object.entity';
// import {v4 as uuidv4} from 'uuid';
// import {SchedulerController} from '../src/controllers/SchedulerController';
// import {PipelineRunOutputController} from '../src/controllers/PipelineRunOutputController';
// import PipelineRunEntityService from '../src/services/PipelineRunEntityService';
// import PipelineRunOutputEntityService from '../src/services/PipelineRunOutputEntityService';
// import JobOrchestratorService from '../src/services/JobOrchestratorService';
// import {pipeline_parameters_oracle_schema} from '../src/schemas/pipeline.parameters';
// import {Secret} from '../src/db/secret.entity';
// jest.mock('../src/services/JobOrchestratorService'); // Automatically mocks the module
// jest.mock('../src/services/KeyvaultService'); // Automatically mocks the module
// describe('Scheduler', () => {
//   jest.setTimeout(600000);
//   const job_id: string = uuidv4().toUpperCase();

//   let datasource: DataSource;
//   let keyvault_service: KeyvaultService;
//   let joborchestrator_service: JobOrchestratorService;
//   let pipeline_service: PipelineEntityService;
//   let pipelinerun_service: PipelineRunEntityService;
//   let pipelinerunoutput_service: PipelineRunOutputEntityService;
//   let pipeline_controller: PipelineController;
//   let pipelinerun_controller: PipelineRunController;
//   let scheduler_controller: SchedulerController;
//   let mssql_container: StartedMSSQLServerContainer;

//   beforeAll(async () => {
//     mssql_container = await new MSSQLServerContainer('mcr.microsoft.com/mssql/server:2022-latest').acceptLicense().start();
//     datasource = new DataSource({
//       type: 'mssql',
//       host: mssql_container.getHost(),
//       database: mssql_container.getDatabase(),
//       username: mssql_container.getUsername(),
//       password: mssql_container.getPassword(),
//       options: {encrypt: false},
//       extra: {
//         validateConnection: false,
//         trustServerCertificate: true,
//         ssl: false,
//       },
//       port: mssql_container.getPort(),
//       entities: [Pipeline, PipelineRun, PipelineRunOutput, DataObject, Secret],
//       migrationsRun: true,
//       migrations: ['./build/db/migrations/*.js'],
//       schema: 'dbo',
//       logging: ['schema', 'migration', 'warn', 'error'],
//       synchronize: false, //! NEVER SET THIS TO TRUE
//     });
//     await datasource.initialize();
//     console.log(`Initialized datasource`);
//     await datasource.runMigrations();
//     console.log(`Run migrations datasource`);
//     keyvault_service = new KeyvaultService('', '', '');
//     joborchestrator_service = new JobOrchestratorService('', '');
//     pipeline_service = new PipelineEntityService(datasource);
//     pipelinerun_service = new PipelineRunEntityService(datasource);
//     pipelinerunoutput_service = new PipelineRunOutputEntityService(datasource);
//     pipeline_controller = new PipelineController(pipeline_service, keyvault_service);
//     pipelinerun_controller = new PipelineRunController(pipeline_service, pipelinerun_service, joborchestrator_service, job_id);
//     scheduler_controller = new SchedulerController(pipeline_service, pipelinerun_service, pipelinerunoutput_service, joborchestrator_service, job_id);
//   });

//   afterAll(async () => {
//     await datasource.destroy();
//     await mssql_container.stop();
//   });

//   it('should check and trigger pipelines if needed', async () => {
//     joborchestrator_service.createJobRun = jest.fn().mockResolvedValue({run_id: uuidv4()});
//     keyvault_service.getSecretValue = jest.fn().mockResolvedValue('value');
//     const pipeline = await pipeline_controller.createPipeline(job_id, '', '* * * * *', {
//       oracle_connectionstring_kv_name: 'oracle_connectionstring_kv_name',
//       objects: [
//         {
//           type: 'table',
//           origin_schema_name: 'origin_schema_name',
//           origin_object_name: 'origin_object_name',
//           destination_schema_name: 'destination_schema_name',
//           destination_object_name: 'destination_object_name',
//         },
//       ],
//     });
//     expect(pipeline).not.toBeUndefined();
//     const parsed_parameters = pipeline_parameters_oracle_schema.safeParse(pipeline.parameters);

//     await scheduler_controller.checkPipelines();

//     const pipelinerun = await pipelinerun_controller.getPipelineRunByPipelineId(pipeline.pipeline_id);
//     expect(pipelinerun.length).toBeGreaterThan(0);
//   });

//   it('should return undefined if job run creation fails', async () => {
//     const job_id = uuidv4().toUpperCase();
//     const pipeline_id = uuidv4().toUpperCase();
//     const parameters = {};

//     joborchestrator_service.createJobRun = jest.fn().mockResolvedValue(undefined);

//     const result = await scheduler_controller.createPipelineRun(job_id, pipeline_id, parameters);

//     expect(result).toBeUndefined();
//   });
//   it('should handle errors gracefully', async () => {
//     pipeline_service.getActivePipelines = jest.fn().mockResolvedValue(new Error('Test error'));

//     await scheduler_controller.checkPipelines();

//     expect(pipeline_service.getActivePipelines).toHaveBeenCalled();
//   });

//   it('should check and update ongoing pipeline runs', async () => {
//     let run_id: string = uuidv4().toUpperCase();
//     joborchestrator_service.createJobRun = jest.fn().mockResolvedValue({run_id: run_id});
//     joborchestrator_service.getJobRunById = jest.fn().mockResolvedValue({
//       job_id: job_id,
//       run_id: run_id,
//       job_name: '',
//       run_executor: '',
//       run_parameters_hash: '',
//       run_state: PipelineRunState.SUCCESSFUL,
//       metadata: {
//         queued_time: null,
//         start_time: null,
//         estimated_duration: null,
//         end_time: null,
//         priority: 0,
//         logs: null,
//       },
//       result: null,
//     });
//     const pipeline = await pipeline_controller.createPipeline(job_id, '', '* * * * *', {});
//     const pipelinerun = await pipelinerun_controller.createPipelineRun(pipeline.job_id, pipeline.pipeline_id, {});

//     await scheduler_controller.checkOngoingPipelines();
//     if (pipelinerun) {
//       const pipelinerun_result = await pipelinerun_controller.getPipelineRunById(pipelinerun.run_id);
//       expect(pipelinerun_result?.state).toBe(PipelineRunState.SUCCESSFUL);
//     }
//   });

//   it('should handle errors gracefully', async () => {
//     pipelinerun_service.getOngoingPipelineRuns = jest.fn().mockResolvedValue(new Error('Test error'));
//     await scheduler_controller.checkOngoingPipelines();
//     expect(pipelinerun_service.getOngoingPipelineRuns).toHaveBeenCalled();
//   });
// });
