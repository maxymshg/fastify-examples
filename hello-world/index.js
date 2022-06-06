import Fastify from "fastify";

const fastify = Fastify({
  logger: true,
});
const port = 3000;

// Declare a route
fastify.get('/', async (request, reply) => {
  reply.send({ msg: 'Hello World!' });
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(port);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
start();
