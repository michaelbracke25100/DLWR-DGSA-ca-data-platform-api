import fastify from 'fastify';

export const server = fastify({
  logger: true,
  // logger: {
  //   transport: {
  //     target: 'pino-pretty',
  //     options: {
  //       colorize: true
  //     }
  //   }
  // },
  bodyLimit: 30 * 1024 * 1024,
});

export default server;
