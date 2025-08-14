import {CustomError} from '../../../utilities/utils';
import {error_msg_scheme} from '../../../schemas/error_msg';
import {query_validation_body, query_validation_return} from '../../../schemas/queryvalidation';
import {type FastifyInstance} from 'fastify';
import {type ZodTypeProvider} from 'fastify-type-provider-zod';

export default function (server: FastifyInstance, _options: unknown, done: () => void): void {
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/api/v1/sqlvalidation',
    method: 'POST',
    schema: {
      description: 'Validate a SQL query syntax and execution',
      tags: ['SqlValidation'],
      body: query_validation_body,
      response: {
        200: query_validation_return,
        400: error_msg_scheme,
      },
    },
    handler: async (req, res) => {
      try {
        const result = await server.sqlvalidation_controller.validateSql(req.body.raw_sql_query);
        return await res.code(200).send(result);
      } catch (error) {
        console.error(error);
        if (error instanceof CustomError) {
          return await res.code(400).send({message: error.message});
        }
        return await res.code(400).send({message: 'Something went wrong validating the sql query'});
      }
    },
  });

  done();
}
