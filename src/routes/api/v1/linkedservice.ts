import {type FastifyInstance} from 'fastify';
import {type ZodTypeProvider} from 'fastify-type-provider-zod';
import {z} from 'zod';
import {error_msg_scheme} from '../../../schemas/error_msg';
import {linkedservice_create_schema, linkedservice_entity_schema, linkedservice_update_schema, LinkedServiceState, LinkedServiceType} from '../../../schemas/linkedservice.entity';
import {CustomError} from '../../../utilities/utils';
import {synapse_pipeline_response_oracle_details_schema, synapse_pipeline_response_oracle_details_transformed_schema} from '../../../schemas/synapse';
import {uuid_uppercase} from '../../../schemas/uuid_uppercase';

interface Column {
  column_name: string;
  column_type: string;
}
interface Object {
  object_name: string;
  type: string;
  columns: Column[];
}

interface Schema {
  schema_name: string;
  objects: Object[];
}

export default function (server: FastifyInstance, _options: unknown, done: () => void): void {
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/linkedservice',
    method: 'POST',
    schema: {
      description: 'Create a linkedservice',
      tags: ['LinkedService'],
      body: linkedservice_create_schema,
      response: {
        200: linkedservice_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const linkedservice = await server.linkedservice_controller.createLinkedService(req.body.type, req.body.config);
        console.log(`Linked service created: ${JSON.stringify(linkedservice)}`);
        if (!linkedservice) throw new CustomError('Adding Keyvault linkedservice failed');
        const response = linkedservice_entity_schema.safeParse(linkedservice);
        if (!response.success) throw new CustomError(`Error in parsing Linked Service: ${JSON.stringify(response.error)}`);
        await res.code(200).send(response.data);
        switch (linkedservice.type as LinkedServiceType) {
          case LinkedServiceType.ORACLESQL: {
            await server.linkedservice_controller.testConnectionstring(linkedservice.linkedservice_id);
            break;
          }
          default:
            break;
        }
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong creating the linkedservice.'});
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/linkedservice',
    method: 'PUT',
    schema: {
      description: 'Update a linkedservice',
      tags: ['LinkedService'],
      body: linkedservice_update_schema,
      response: {
        200: linkedservice_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const linkedservice = await server.linkedservice_controller.updateLinkedService(req.body.linkedservice_id, LinkedServiceState.CREATED, req.body.type, req.body.config);
        if (!linkedservice) throw new CustomError('Adding Keyvault linkedservice failed');

        const response = linkedservice_entity_schema.safeParse(linkedservice);
        if (!response.success) throw new CustomError(`Error in parsing Linked Service: ${JSON.stringify(response.error)}`);
        await res.code(200).send(response.data);
        switch (linkedservice.type as LinkedServiceType) {
          case LinkedServiceType.ORACLESQL: {
            await server.linkedservice_controller.testConnectionstring(linkedservice.linkedservice_id);
            break;
          }
          default:
            break;
        }
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong updating the linkedservice.'});
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/linkedservice/:linkedservice_id',
    method: 'DELETE',
    schema: {
      description: 'Delete a linkedservice',
      tags: ['LinkedService'],
      params: z.object({linkedservice_id: uuid_uppercase}),
      response: {
        200: linkedservice_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const linkedservice = await server.linkedservice_controller.deleteLinkedService(req.params.linkedservice_id);
        if (!linkedservice) throw new CustomError('LinkedService was not found');
        const response = linkedservice_entity_schema.safeParse(linkedservice);
        if (!response.success) throw new CustomError(`Error in parsing Linked Service: ${JSON.stringify(response.error)}`);
        return await res.code(200).send(response.data);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong deleting the linkedservice.'});
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/linkedservice/:linkedservice_id',
    method: 'GET',
    schema: {
      description: 'Get a linkedservice',
      tags: ['LinkedService'],
      params: z.object({linkedservice_id: uuid_uppercase}),
      response: {
        200: linkedservice_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const linkedservice = await server.linkedservice_controller.getLinkedServiceById(req.params.linkedservice_id);
        if (!linkedservice) throw new CustomError('LinkedService was not found');
        const response = linkedservice_entity_schema.safeParse(linkedservice);
        if (!response.success) throw new CustomError(`Error in parsing Linked Service: ${JSON.stringify(response.error)}`);
        return await res.code(200).send(response.data);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong getting the linkedservice.'});
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/linkedservice/:linkedservice_id/details',
    method: 'GET',
    schema: {
      description: 'Get a linkedservice details',
      tags: ['LinkedService'],
      params: z.object({linkedservice_id: uuid_uppercase}),
      response: {
        200: synapse_pipeline_response_oracle_details_transformed_schema,
        400: error_msg_scheme,
        500: z.string(),
      },
    },
    handler: async (req, res) => {
      try {
        const linkedservice = await server.linkedservice_controller.getLinkedServiceById(req.params.linkedservice_id);
        if (!linkedservice) throw new CustomError('LinkedService was not found');
        if (typeof linkedservice.config === 'string') throw new CustomError('Config parsed error');
        if ((linkedservice.type as LinkedServiceType) === LinkedServiceType.ORACLESQL) {
          const synapse = await server.linkedservice_controller.testQuery(linkedservice.linkedservice_id);
          if (!synapse) return await res.code(500).send(synapse ? JSON.stringify(synapse) : 'Something went wrong');
          const synapse_response = synapse_pipeline_response_oracle_details_schema.safeParse(synapse);
          if (synapse_response.error) return await res.code(500).send('Something went wrong');

          const result: Schema[] = [];

          synapse_response.data.result_query.value.forEach(item => {
            let schema = result.find(s => s.schema_name === item.SCHEMA_NAME);
            if (!schema) {
              schema = {
                schema_name: item.SCHEMA_NAME,
                objects: [],
              };
              result.push(schema);
            }

            let object = schema.objects.find(t => t.object_name === item.TABLE_NAME);
            if (!object) {
              object = {
                object_name: item.TABLE_NAME,
                type: item.OBJECT_TYPE,
                columns: [],
              };
              schema.objects.push(object);
            }

            object.columns.push({
              column_name: item.COLUMN_NAME,
              column_type: item.DATA_TYPE,
            });
          });
          const result_parsed = synapse_pipeline_response_oracle_details_transformed_schema.safeParse(result);
          if (result_parsed.error) return await res.code(500).send(JSON.stringify(result_parsed.error));
          return await res.code(200).send(result_parsed.data);
        }
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong getting the linkedservice.'});
      }
    },
  });

  done();
}
