import {type FastifyInstance} from 'fastify';
import {type ZodTypeProvider} from 'fastify-type-provider-zod';
import {z} from 'zod';
import {error_msg_scheme} from '../../../schemas/error_msg';
import {pipeline_entity_schema, PipelinePrivacyLevel, PipelineState, post_pipeline_entity_schema, put_pipeline_entity_schema} from '../../../schemas/pipeline.entity';
import {pipeline_parameters_oracle_schema} from '../../../schemas/pipeline.parameters';
import {pipeline_parameters_transform_schema} from '../../../schemas/pipeline.parameters';
import {getConfig} from '../../../config/config';
import {metadata_entity_schema} from '../../../schemas/metadata.entity';
import {CustomError, FilterObjectByUserGroup, SetUserData} from '../../../utilities/utils';
import {uuid_uppercase} from '../../../schemas/uuid_uppercase';

export default function (server: FastifyInstance, _options: unknown, done: () => void): void {
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/pipeline',
    method: 'POST',
    schema: {
      description: 'Create a pipeline',
      tags: ['Pipeline'],
      body: post_pipeline_entity_schema,
      response: {
        200: pipeline_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        let parameters;
        let pipeline;
        const metadata = metadata_entity_schema.safeParse(req.body.metadata);
        if (metadata.error) throw new CustomError('Metadata invalid');
        switch (req.body.job_id) {
          case getConfig().SYNAPSE_PIPELINE_ORACLE_ID: {
            parameters = pipeline_parameters_oracle_schema.safeParse(req.body.parameters).data;
            if (!parameters) return await res.code(400).send({message: 'Parameters are wrong'});
            for (let index = 0; index < parameters.objects.length; index++) {
              const object = parameters.objects[index];
              const origin: string = object.origin_schema_name + '.' + object.origin_object_name;
              const destination: string = object.destination_schema_name + '.' + object.destination_object_name;
              const origin_check = await server.dataobject_controller.checkOrigin(origin, undefined);
              if (origin_check) return await res.code(400).send({message: `Origin ${origin} already exists in another pipeline`});
              const destination_check = await server.dataobject_controller.checkDestination(destination, undefined);
              if (destination_check) return await res.code(400).send({message: `Destination ${destination} already exists in another pipeline`});
            }

            if (!parameters) return await res.code(400).send({message: 'Parameters are wrong'});
            pipeline = await server.pipeline_controller.createPipeline(req.body.job_id, req.body.name, req.body.description, req.body.modified_by, req.body.owner, req.body.privacy_level, req.body.cron, req.body.type, req.body.linkedservice_id, parameters, metadata.data, req.body.user_groups);

            if (!pipeline) return await res.code(400).send({message: 'Something went wrong creating the pipeline.'});
            await server.dataobject_controller.createPipelineDataObjects(
              pipeline.pipeline_id,
              parameters.objects.map(object => {
                return {origin_name: object.origin_schema_name + '.' + object.origin_object_name, destination_name: object.destination_schema_name + '.' + object.destination_object_name};
              }),
              req.body.user_groups,
            );

            break;
          }

          case getConfig().SYNAPSE_PIPELINE_TRANSFORM_ID: {
            parameters = pipeline_parameters_transform_schema.safeParse(req.body.parameters).data;
            if (!parameters) return await res.code(400).send({message: 'Parameters are wrong'});
            for (let index = 0; index < parameters.objects.length; index++) {
              const object = parameters.objects[index];
              const destination: string = object.destination_schema_name + '.' + object.destination_object_name;
              const destination_check = await server.dataobject_controller.checkDestination(destination, undefined);
              if (destination_check) return await res.code(400).send({message: `Destination ${destination} already exists in another pipeline`});
            }

            if (!parameters) return await res.code(400).send({message: 'Parameters are wrong'});
            pipeline = await server.pipeline_controller.createPipeline(req.body.job_id, req.body.name, req.body.description, req.body.modified_by, req.body.owner, req.body.privacy_level, req.body.cron, req.body.type, null, parameters, metadata.data, req.body.user_groups);

            if (!pipeline) return await res.code(400).send({message: 'Something went wrong creating the pipeline.'});
            await server.dataobject_controller.createPipelineDataObjects(
              pipeline.pipeline_id,
              parameters.objects.map(object => {
                return {origin_name: 'N/A', destination_name: object.destination_schema_name + '.' + object.destination_object_name};
              }),
              req.body.user_groups,
            );

            break;
          }

          default:
            return await res.code(400).send({message: 'job_id wrong'});
        }

        const response = pipeline_entity_schema.safeParse(pipeline);
        if (!response.success) throw new CustomError(`Error in parsing Pipeline: ${JSON.stringify(response.error)}`);

        return await res.code(200).send(response.data);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong creating the pipeline.'});
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/pipeline',
    method: 'PUT',
    schema: {
      description: 'Update a pipeline',
      tags: ['Pipeline'],
      body: put_pipeline_entity_schema,
      response: {
        200: pipeline_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        let parameters;
        let pipeline;
        const metadata = metadata_entity_schema.safeParse(req.body.metadata);
        if (metadata.error) throw new CustomError('Metadata invalid');
        switch (req.body.job_id) {
          case getConfig().SYNAPSE_PIPELINE_ORACLE_ID: {
            parameters = pipeline_parameters_oracle_schema.safeParse(req.body.parameters).data;
            if (!parameters) return await res.code(400).send({message: 'Parameters are wrong'});
            for (let index = 0; index < parameters.objects.length; index++) {
              const object = parameters.objects[index];
              const origin: string = object.origin_schema_name + '.' + object.origin_object_name;
              const destination: string = object.destination_schema_name + '.' + object.destination_object_name;
              const origin_check = await server.dataobject_controller.checkOrigin(origin, req.body.pipeline_id);
              if (origin_check) return await res.code(400).send({message: `Origin ${origin} already exists in another pipeline`});
              const destination_check = await server.dataobject_controller.checkDestination(destination, req.body.pipeline_id);
              if (destination_check) return await res.code(400).send({message: `Destination ${destination} already exists in another pipeline`});
            }

            if (!parameters) return await res.code(400).send({message: 'Parameters are wrong'});
            pipeline = await server.pipeline_controller.updatePipeline(req.body.pipeline_id, req.body.job_id, req.body.state, req.body.privacy_level, req.body.name, req.body.description, req.body.modified_by, req.body.cron, req.body.linkedservice_id, parameters, metadata.data, req.body.user_groups);
            if (!pipeline) return await res.code(400).send({message: 'Something went wrong updating the pipeline.'});
            await server.dataobject_controller.createPipelineDataObjects(
              pipeline.pipeline_id,
              parameters.objects.map(object => {
                return {origin_name: object.origin_schema_name + '.' + object.origin_object_name, destination_name: object.destination_schema_name + '.' + object.destination_object_name};
              }),
              req.body.user_groups,
            );

            break;
          }

          case getConfig().SYNAPSE_PIPELINE_TRANSFORM_ID: {
            parameters = pipeline_parameters_transform_schema.safeParse(req.body.parameters).data;
            if (!parameters) return await res.code(400).send({message: 'Parameters are wrong'});
            for (let index = 0; index < parameters.objects.length; index++) {
              const object = parameters.objects[index];
              const destination: string = object.destination_schema_name + '.' + object.destination_object_name;
              const destination_check = await server.dataobject_controller.checkDestination(destination, req.body.pipeline_id);
              if (destination_check) return await res.code(400).send({message: `Destination ${destination} already exists in another pipeline`});
            }

            if (!parameters) return await res.code(400).send({message: 'Parameters are wrong'});
            pipeline = await server.pipeline_controller.updatePipeline(req.body.pipeline_id, req.body.job_id, req.body.state, req.body.privacy_level, req.body.name, req.body.description, req.body.modified_by, req.body.cron, null, parameters, metadata.data, req.body.user_groups);
            if (!pipeline) return await res.code(400).send({message: 'Something went wrong updating the pipeline.'});
            await server.dataobject_controller.createPipelineDataObjects(
              pipeline.pipeline_id,
              parameters.objects.map(object => {
                return {origin_name: 'N/A', destination_name: object.destination_schema_name + '.' + object.destination_object_name};
              }),
              req.body.user_groups,
            );

            break;
          }

          default:
            return await res.code(400).send({message: 'job_id wrong'});
        }

        const response = pipeline_entity_schema.safeParse(pipeline);
        if (!response.success) throw new CustomError(`Error in parsing Pipeline: ${JSON.stringify(response.error)}`);
        return await res.code(200).send(response.data);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong updating the pipeline.'});
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/pipeline/:pipeline_id',
    method: 'DELETE',
    schema: {
      description: 'Delete a pipeline',
      tags: ['Pipeline'],
      params: z.object({pipeline_id: uuid_uppercase}),
      response: {
        200: pipeline_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const pipeline = await server.pipeline_controller.deletePipeline(req.params.pipeline_id);
        if (!pipeline) return await res.code(400).send({message: 'Something went wrong deleting the pipeline.'});
        const response = pipeline_entity_schema.safeParse(pipeline);
        if (!response.success) throw new CustomError(`Error in parsing Pipeline: ${JSON.stringify(response.error)}`);
        return await res.code(200).send(response.data);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong deleting the pipeline.'});
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/pipeline',
    method: 'GET',
    schema: {
      headers: z.object({
        user_id: z.string().optional(),
        user_groups: z.string().optional(),
      }),
      description: 'Get all pipelines',
      tags: ['Pipeline'],
      querystring: z.object({
        take: z.string().optional(),
        pipeline_id: z.string().optional(),
        job_id: z.string().optional(),
        linkedservice_id: z.string().optional(),
        name: z.string().optional(),
        state: z.string().optional(),
        privacy_level: z.string().optional(),
      }),
      response: {
        200: z.array(pipeline_entity_schema),
        400: error_msg_scheme,
      },
    },
    preHandler: (req, res, done) => {
      SetUserData(req, server);
      done();
    },
    handler: async (req, res) => {
      try {
        const take = req.query.take ? parseInt(req.query.take) : undefined;
        const pipelines = await server.pipeline_controller.getPipelines(take, req.query.pipeline_id, req.query.job_id, req.query.linkedservice_id, req.query.name, req.query.state as PipelineState, req.query.privacy_level as PipelinePrivacyLevel);

        if (!pipelines) return await res.code(400).send({message: 'Something went wrong getting the pipeline.'});
        const response = z.array(pipeline_entity_schema).safeParse(pipelines);
        if (!response.success) throw new CustomError(`Error in parsing Pipeline: ${JSON.stringify(response.error)}`);
        const filtered_pipelines = FilterObjectByUserGroup(response.data, server.user.user_groups);
        return await res.code(200).send(filtered_pipelines);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong getting the pipeline.'});
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/pipeline/:pipeline_id',
    method: 'GET',
    schema: {
      description: 'Get all pipelines',
      params: z.object({pipeline_id: uuid_uppercase}),
      tags: ['Pipeline'],
      response: {
        200: pipeline_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const pipeline = await server.pipeline_controller.getPipelineById(req.params.pipeline_id);

        if (!pipeline) return await res.code(400).send({message: 'Something went wrong getting the pipeline.'});
        const response = pipeline_entity_schema.safeParse(pipeline);
        if (!response.success) throw new CustomError(`Error in parsing Pipeline: ${JSON.stringify(response.error)}`);
        return await res.code(200).send(response.data);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong getting the pipeline.'});
      }
    },
  });

  done();
}
