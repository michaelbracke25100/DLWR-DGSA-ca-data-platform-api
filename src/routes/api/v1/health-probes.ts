import {type FastifyInstance} from 'fastify';
import {type ZodTypeProvider} from 'fastify-type-provider-zod';

export default function (server: FastifyInstance, _options: unknown, done: () => void): void {
  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/liveness',
    method: 'GET',
    schema: {
      hide: true,
      tags: ['Health Probes'],
    },
    handler: async (req, res) => {
      await res.code(204).send();
    },
  });

  server.withTypeProvider<ZodTypeProvider>().route({
    url: '/readiness',
    method: 'GET',
    schema: {
      hide: true,
      tags: ['Health Probes'],
    },
    handler: async (req, res) => {
      await res.code(204).send();
    },
  });
  done();
}
