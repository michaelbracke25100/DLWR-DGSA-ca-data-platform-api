import helmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import datasource, { close_db_connection } from './config/typeorm-config';
import fastifyRateLimit from '@fastify/rate-limit';
import server from './config/fastify-config';
import KeyvaultService from './services/KeyvaultService';
import JobOrchestratorService from './services/JobOrchestratorService';
import * as nodeSchedule from 'node-schedule';
import PipelineRunOutputEntityService from './services/PipelineRunOutputEntityService';
import PipelineRunEntityService from './services/PipelineRunEntityService';
import PipelineEntityService from './services/PipelineEntityService';
import { IPipelineController, PipelineController } from './controllers/PipelineController';
import { IPipelineRunController, PipelineRunController } from './controllers/PipelineRunController';
import { ISqlValidationController, SqlValidationController } from './controllers/SqlValidationController';
import { ISchedulerController, SchedulerController } from './controllers/SchedulerController';
import { getConfig } from './config/config';
import DataObjectEntityService from './services/DataObjectEntityService';
import { DataObjectController, IDataObjectController } from './controllers/DataObjectController';
import { ILinkedServiceController, LinkedServiceController } from './controllers/LinkedServiceController';
import LinkedServiceEntityService from './services/LinkedServiceEntityService';
import MetadataEntityService from './services/MetadataEntityService';
import { AzureSynapseController, IAzureSynapseController } from './controllers/AzureSynapseController';
import { AzureSynapseService } from './services/AzureSynapseService';
import StorageService from './services/StorageService';
import PipelineRunLogEntityService from './services/PipelineRunLogEntityService';
import { UserType } from './schemas/user';

// * decorate the request so that performance is better and we pass the env variable everywhere
declare module 'fastify' {
  export interface FastifyInstance {
    pipeline_controller: IPipelineController;
    pipelinerun_controller: IPipelineRunController;
    scheduler_controller: ISchedulerController;
    dataobject_controller: IDataObjectController;
    linkedservice_controller: ILinkedServiceController;
    azuresynapse_controller: IAzureSynapseController;
    sqlvalidation_controller: ISqlValidationController;
    user: UserType;
  }
}

datasource
  .initialize()
  .then(async () => {
    try {
      await server.register(fastifySwagger, {
        openapi: {
          info: { title: 'CUSTOMER_NAME', version: '1.0.0' },
          components: {
            securitySchemes: {
              authorization_access_token: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
              },
              authorization_refresh_token: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
              },
            },
          },
        },
        transform: jsonSchemaTransform,
      });
      await server.register(fastifySwaggerUI, {
        routePrefix: '/api/docs',
        uiConfig: { layout: 'BaseLayout' },
      });

      // * Add schema validator and serializer
      server.setValidatorCompiler(validatorCompiler);
      server.setSerializerCompiler(serializerCompiler);

      // * Custom error handler
      server.setErrorHandler(async (error, request, reply) => {
        if (error.statusCode === 429) {
          return await reply.code(429).send({ message: 'You hit the rate limit! Slow down please!' });
        }
        console.log('error request: ', request.body);
        const status_code = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        return await reply.status(status_code).send({ message: message });
      });

      const joborchestrator_service = new JobOrchestratorService(
        getConfig().CA_JOBORCHESTRATOR_URL,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlcyI6WyJ0ZXN0Il19.PPiiPmPdKiNwZt4lHnsxBcGDFNGxHjxfN2jvyIe5mls', //TODO FIX TOKEN
      );

      const storage_service = new StorageService(getConfig().ID_CLIENTID);
      const keyvault_service = new KeyvaultService(getConfig().ID_CLIENTID, getConfig().KEYVAULT_URL, getConfig().ENV);
      const pipeline_entity_service = new PipelineEntityService(datasource);
      const pipelinerun_entity_service = new PipelineRunEntityService(datasource);
      const pipelinerunlog_entity_service = new PipelineRunLogEntityService(datasource);
      const pipelinerunoutput_entity_service = new PipelineRunOutputEntityService(datasource);
      const dataobject_entity_service = new DataObjectEntityService(datasource);
      const linkedservice_entity_service = new LinkedServiceEntityService(datasource);
      const metadata_entity_service = new MetadataEntityService(datasource);
      const azuresynapse_service = new AzureSynapseService(getConfig().SYNAPSE_ENDPOINT, getConfig().ID_CLIENTID, getConfig().SYNAPSE_PIPELINE_NAME);

      // Decorate controllers with services
      const pipeline_controller = new PipelineController(pipeline_entity_service, keyvault_service, linkedservice_entity_service, metadata_entity_service);
      const pipelinerun_controller = new PipelineRunController(pipeline_entity_service, pipelinerun_entity_service, pipelinerunlog_entity_service, joborchestrator_service, linkedservice_entity_service, getConfig().SYNAPSE_PIPELINE_ORACLE_ID, getConfig().SYNAPSE_PIPELINE_TRANSFORM_ID);
      const scheduler_controller = new SchedulerController(
        pipeline_entity_service,
        pipelinerun_entity_service,
        pipelinerunlog_entity_service,
        pipelinerunoutput_entity_service,
        joborchestrator_service,
        linkedservice_entity_service,
        getConfig().SYNAPSE_PIPELINE_ORACLE_ID,
        getConfig().SYNAPSE_PIPELINE_TRANSFORM_ID,
      );
      const dataobject_controller = new DataObjectController(dataobject_entity_service, pipeline_entity_service, metadata_entity_service, storage_service, getConfig().STORAGE_PRIVINT_NAME, getConfig().STORAGE_PUBLEXT_NAME);
      const linkedservice_controller = new LinkedServiceController(linkedservice_entity_service, keyvault_service, pipeline_entity_service, azuresynapse_service);
      const azuresynapse_controller = new AzureSynapseController(azuresynapse_service, getConfig().SYNAPSE_PIPELINE_NAME);
      const sqlvalidation_controller = new SqlValidationController(datasource.manager);
      const user: UserType = {};

      server.decorate('pipeline_controller', pipeline_controller);
      server.decorate('pipelinerun_controller', pipelinerun_controller);
      server.decorate('scheduler_controller', scheduler_controller);
      server.decorate('keyvault_service', keyvault_service);
      server.decorate('dataobject_controller', dataobject_controller);
      server.decorate('linkedservice_controller', linkedservice_controller);
      server.decorate('azuresynapse_controller', azuresynapse_controller);
      server.decorate('sqlvalidation_controller', sqlvalidation_controller);
      server.decorate('user', user);

      //* Helmet helps secure Express apps by setting HTTP response headers.
      await server.register(helmet);

      //* Added rate limiting for API endpoints except for local development 😁
      server.register(fastifyRateLimit, {
        allowList: ['127.0.0.1'],
        max: 500,
        timeWindow: '1 minute',
      });

      //* All routes foreseen on the fastify instance.
      await server.register(import('./routes/api/v1/health-probes'));
      await server.register(import('./routes/api/v1/pipeline'));
      await server.register(import('./routes/api/v1/pipeline_run'));
      await server.register(import('./routes/api/v1/linkedservice'));
      await server.register(import('./routes/api/v1/dataobject'));
      await server.register(import('./routes/api/v1/sqlvalidation'));

      server.addHook('onClose', async () => {
        await close_db_connection();
        console.log('Fastify & DB Pool closed');
      });

      await server.listen({ port: 8080, host: '0.0.0.0' });

      //TODO Use socket
      //* start listening to Job Orchestrator
      //server.socket_service.connect();
      //* Check every minute if pipelines have to run
      nodeSchedule.scheduleJob('* * * * *', () => server.scheduler_controller.checkPipelines());
      nodeSchedule.scheduleJob('* * * * *', () => server.scheduler_controller.checkOngoingPipelines());
      if (getConfig().ENV != 'PRODUCTION') nodeSchedule.scheduleJob('0 0 * * *', () => server.scheduler_controller.disableActivePipelines());
    } catch (err) {
      server.log.error(err);
      throw err;
    }
  })
  .catch(error => {
    console.log(error);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});
