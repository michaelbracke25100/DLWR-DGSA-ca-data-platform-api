import {type FastifyInstance} from 'fastify';
import {type ZodTypeProvider} from 'fastify-type-provider-zod';
import {z} from 'zod';
import {error_msg_scheme} from '../../../schemas/error_msg';
import {pipelinerun_array_entity_schema, pipelinerun_entity_schema, PipelineRunState} from '../../../schemas/pipeline_run.entity';
import {CustomError} from '../../../utilities/utils';
import {uuid_uppercase} from '../../../schemas/uuid_uppercase';

export default function (server: FastifyInstance, _options: unknown, done: () => void): void {
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/pipeline/:pipeline_id/runs',
    method: 'POST',
    schema: {
      description: 'Run a pipeline',
      params: z.object({pipeline_id: uuid_uppercase}),
      tags: ['Pipeline'],
      body: z.object({
        modified_by: z.object({
          name: z.string().min(1).nullable(),
          user_id: z.string().min(1).nullable(),
        }),
      }),
      response: {
        200: pipelinerun_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const pipeline = await server.pipeline_controller.getPipelineById(req.params.pipeline_id);
        if (!pipeline) throw new CustomError('Pipeline not found');
        if (typeof pipeline.parameters === 'string') throw new CustomError('Parameters of type string');
        const pipelinerun = await server.pipelinerun_controller.createPipelineRun(pipeline.pipeline_id, req.body.modified_by);
        if (!pipelinerun) throw new CustomError('Pipeline start failed');
        const response = pipelinerun_entity_schema.safeParse(pipelinerun);
        if (!response.success) throw new CustomError(`Error in parsing Pipeline Run: ${JSON.stringify(response.error)}`);
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
    url: '/api/v1/pipeline/:pipeline_id/runs',
    method: 'GET',
    schema: {
      description: 'Get all pipeline runs for a specific pipeline',
      tags: ['PipelineRun'],
      querystring: z.object({
        take: z.string().optional(),
        state: z.string().optional(),
      }),
      params: z.object({pipeline_id: uuid_uppercase}),
      response: {
        200: pipelinerun_array_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const pipeline = await server.pipeline_controller.getPipelineById(req.params.pipeline_id);
        if (!pipeline) return await res.code(400).send({message: 'Pipeline does not exist'});
        const take = req.query.take ? parseInt(req.query.take) : undefined;
        const pipelineruns = await server.pipelinerun_controller.getPipelineRunByPipelineId(req.params.pipeline_id, take, req.query.state as PipelineRunState);
        const response = pipelinerun_array_entity_schema.safeParse(pipelineruns);
        if (!response.success) throw new CustomError(`Error in parsing Pipeline Run: ${JSON.stringify(response.error)}`);
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
    url: '/api/v1/pipeline/:pipeline_id/runs/:run_id',
    method: 'GET',
    schema: {
      description: 'Get a pipeline run',
      tags: ['PipelineRun'],
      params: z.object({pipeline_id: uuid_uppercase, run_id: uuid_uppercase}),
      response: {
        200: pipelinerun_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const pipeline = await server.pipeline_controller.getPipelineById(req.params.pipeline_id);
        if (!pipeline) return await res.code(400).send({message: 'Pipeline does not exist'});
        const pipelinerun = await server.pipelinerun_controller.getPipelineRunById(req.params.run_id);
        if (pipelinerun) {
          const response = pipelinerun_entity_schema.safeParse(pipeline);
          if (!response.success) throw new CustomError(`Error in parsing Pipeline Run: ${JSON.stringify(response.error)}`);
          return await res.code(200).send(response.data);
        } else {
          return await res.code(400).send({message: 'Something went wrong creating the pipeline.'});
        }
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong creating the pipeline.'});
      }
    },
  });

  done();
}
