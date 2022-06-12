import path from "path";
import { fileURLToPath } from 'url';
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";

const fastify = Fastify({
  logger: true,
});
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register static
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/static'
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen({
      port
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}
start();
