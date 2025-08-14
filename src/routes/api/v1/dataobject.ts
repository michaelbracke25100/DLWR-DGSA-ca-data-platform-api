import { type FastifyInstance } from 'fastify';
import { type ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { error_msg_scheme } from '../../../schemas/error_msg';
import { dataobject_array_entity_schema, dataobject_create_schema, dataobject_entity_schema, dataobject_metadata_update_schema, DataObjectState } from '../../../schemas/dataobject.entity';
import { CustomError, FilterObjectByUserGroup, SetUserData } from '../../../utilities/utils';
import { uuid_uppercase } from '../../../schemas/uuid_uppercase';
import { getConfig } from '../../../config/config';

export default function (server: FastifyInstance, _options: unknown, done: () => void): void {
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/dataobject',
    method: 'POST',
    schema: {
      description: 'Create a dataobject',
      tags: ['DataObject'],
      body: dataobject_create_schema,
      response: {
        200: dataobject_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const dataobject = await server.dataobject_controller.createDataObject(req.body.dataobject_id, req.body.name, null, req.body.state, req.body.modified_by, req.body.metadata, req.body.user_groups, req.body.managed_by);
        if (!dataobject) throw new CustomError('Creating data object failed');

        const response = dataobject_entity_schema.safeParse(dataobject);
        if (!response.success) throw new CustomError(`Error in parsing Dataobject: ${JSON.stringify(response.error)}`);
        return await res.code(200).send(response.data);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({ message: error.message });
        }
        return await res.code(400).send({ message: 'Something went wrong creating the dataobject.' });
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/dataobject/:dataobject_id/metadata',
    method: 'PUT',
    schema: {
      description: 'Update a dataobject',
      tags: ['DataObject'],
      params: z.object({ dataobject_id: uuid_uppercase }),
      body: dataobject_metadata_update_schema,
      response: {
        200: dataobject_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const result = await server.dataobject_controller.updateDataObjectMetadata(req.params.dataobject_id, req.body.modified_by, req.body.metadata, req.body.user_groups, req.body.managed_by, req.body.is_enabled_for_download_apis);
        if (!result) throw new CustomError('Updating data object failed');

        const response = dataobject_entity_schema.safeParse(result);
        if (!response.success) throw new CustomError(`Error in parsing Dataobject: ${JSON.stringify(response.error)}`);
        return await res.code(200).send(response.data);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({ message: error.message });
        }
        return await res.code(400).send({ message: 'Something went wrong updating the dataobject.' });
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/dataobject/:dataobject_id/publish',
    method: 'PUT',
    schema: {
      description: 'Update a dataobject',
      tags: ['DataObject'],
      params: z.object({ dataobject_id: uuid_uppercase }),
      response: {
        200: dataobject_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const dataobject = await server.dataobject_controller.publishDataObject(req.params.dataobject_id);
        if (!dataobject) throw new CustomError('Updating data object failed');

        const response = dataobject_entity_schema.safeParse(dataobject);
        if (!response.success) throw new CustomError(`Error in parsing Dataobject: ${JSON.stringify(response.error)}`);
        return await res.code(200).send(response.data);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({ message: error.message });
        }
        return await res.code(400).send({ message: 'Something went wrong updating the dataobject.' });
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/dataobject/:dataobject_id/unpublish',
    method: 'PUT',
    schema: {
      description: 'Update a dataobject',
      tags: ['DataObject'],
      params: z.object({ dataobject_id: uuid_uppercase }),
      response: {
        200: dataobject_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const dataobject = await server.dataobject_controller.unPublishDataObject(req.params.dataobject_id);
        if (!dataobject) throw new CustomError('Updating data object failed');

        const response = dataobject_entity_schema.safeParse(dataobject);
        if (!response.success) throw new CustomError(`Error in parsing Dataobject: ${JSON.stringify(response.error)}`);
        return await res.code(200).send(response.data);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({ message: error.message });
        }
        return await res.code(400).send({ message: 'Something went wrong updating the dataobject.' });
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/dataobject/:dataobject_id',
    method: 'DELETE',
    schema: {
      description: 'Delete a dataobject',
      tags: ['DataObject'],
      params: z.object({ dataobject_id: uuid_uppercase }),
      response: {
        200: dataobject_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        await server.dataobject_controller.deleteDataObject(req.params.dataobject_id);
        return await res.code(200).send();
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({ message: error.message });
        }
        return await res.code(400).send({ message: 'Something went wrong deleting the dataobject.' });
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/dataobject/:dataobject_id',
    method: 'GET',
    schema: {
      description: 'Delete a dataobject',
      tags: ['DataObject'],
      params: z.object({ dataobject_id: uuid_uppercase }),
      response: {
        200: dataobject_entity_schema,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const dataobject = await server.dataobject_controller.getDataObjectById(req.params.dataobject_id);
        const response = dataobject_entity_schema.safeParse(dataobject);
        if (!response.success) throw new CustomError(`Error in parsing Dataobject: ${JSON.stringify(response.error)}`);
        return await res.code(200).send(response.data);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({ message: error.message });
        }
        return await res.code(400).send({ message: 'Something went wrong deleting the dataobject.' });
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/dataobjects',
    method: 'GET',
    schema: {
      headers: z.object({
        user_id: z.string().optional(),
        user_groups: z.string().optional(),
      }),
      description: 'Get all dataobjects (without values)',
      tags: ['DataObject'],
      querystring: z.object({
        pipeline_id: z.string().optional(),
        type: z.string().min(1).optional(),
        state: z.enum([DataObjectState.DELETED, DataObjectState.PUBLISHED, DataObjectState.UNPUBLISHED]).optional(),
      }),
      response: {
        200: dataobject_array_entity_schema,
        400: error_msg_scheme,
      },
    },
    preHandler: (req, res, done) => {
      SetUserData(req, server);
      done();
    },
    handler: async (req, res) => {
      try {
        const dataobjects = await server.dataobject_controller.getDataObjectsEffectiveUserGroups(req.query.pipeline_id, req.query.type, req.query.state);
        const response = dataobject_array_entity_schema.safeParse(dataobjects);
        if (!response.success) throw new CustomError(`Error in parsing Dataobject: ${JSON.stringify(response.error)}`);
        const filtered_dataobjects = FilterObjectByUserGroup(response.data, server.user.user_groups);
        return await res.code(200).send(filtered_dataobjects);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({ message: error.message });
        }
        return await res.code(400).send({ message: 'Something went wrong getting the dataobject.' });
      }
    },
  });
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/dataobjects/download',
    method: 'GET',
    schema: {
      headers: z.object({
        user_id: z.string().optional(),
        user_groups: z.string().optional(),
      }),
      description: 'Download a data object',
      tags: ['DataObject'],
      querystring: z.object({
        name: z.string(),
      }),
      response: {
        200: z.any(),
        400: error_msg_scheme,
      },
    },
    preHandler: (req, res, done) => {
      SetUserData(req, server);
      done();
    },
    handler: async (req, res) => {
      try {
        const response = await server.dataobject_controller.downloadDataObject(getConfig().STORAGE_PRIVINT_NAME, 'files', req.query.name.replace(/^\//, ''));

        const isAdmin = server.user?.user_groups?.map(g => g.toLowerCase()).includes('admin_dataplatform') ?? false;
        const hasMatchingGroup = isAdmin || (server.user?.user_groups?.some(group => response.DataObject?.user_groups?.includes(group) ?? false) ?? false);
        if (!hasMatchingGroup) {
          return await res.code(400).send({ message: 'User has no access' });
        } else {
          res.header('Content-Type', response.contentType);
          res.header('Content-Disposition', `attachment; filename="${req.query.name.split('/').pop()}"`);
          return res.send(response.Stream);
        }
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({ message: error.message });
        }
        return await res.code(400).send({ message: 'Something went wrong getting the dataobject.' });
      }
    },
  });

  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/dataobjects/putblock',
    method: 'PUT',
    schema: {
      headers: z.object({
        user_id: z.string().optional(),
        user_groups: z.string().optional(),
      }),
      description: 'Download a data object',
      tags: ['DataObject'],
      querystring: z.object({
        block_id: z.string(),
        file_name: z.string(),
      }),
      body: z.string(),
      response: {
        200: z.any(),
        400: error_msg_scheme,
      },
    },
    preHandler: (req, res, done) => {
      SetUserData(req, server);
      done();
    },
    handler: async (req, res) => {
      try {
        const byteArray = Buffer.from(req.body, 'base64'); // Convert base64 to Buffer
        const response = await server.dataobject_controller.putBlock(getConfig().STORAGE_PRIVINT_NAME, 'files', req.query.file_name, req.query.block_id, byteArray);
        if (response.status === 'SUCCESS') {
          res.status(200).send(response);
        } else {
          res.status(400).send(response);
        }
      } catch (error) {
        res.status(500).send({ message: error });
      }
    },
  });

  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/dataobjects/putblocklist',
    method: 'PUT',
    schema: {
      headers: z.object({
        user_id: z.string().optional(),
        user_groups: z.string().optional(),
      }),
      description: 'Download a data object',
      tags: ['DataObject'],
      querystring: z.object({
        file_name: z.string(),
      }),
      body: z.object({
        blocklist: z.array(z.string()),
      }),
      response: {
        200: z.any(),
        400: error_msg_scheme,
      },
    },
    preHandler: (req, res, done) => {
      SetUserData(req, server);
      done();
    },
    handler: async (req, res) => {
      try {
        const response = await server.dataobject_controller.putBlockList(getConfig().STORAGE_PRIVINT_NAME, 'files', req.query.file_name, req.body.blocklist);
        if (response.status === 'SUCCESS') {
          res.status(200).send(response);
        } else {
          res.status(400).send(response);
        }
      } catch (error) {
        console.log(error);
      }
    },
  });
  done();
}
