import path from "path";
import { fileURLToPath } from 'url';
import Fastify from "fastify";
import fastifyEjs from "@fastify/view";
import * as ejs from "ejs";
import fastifyStatic from "@fastify/static";

const fastify = Fastify({
  logger: true,
});
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register static
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public')
});

// Register template engine
fastify.register(fastifyEjs, {
  engine: {
    ejs: ejs,
  },
});

// Declare a route
fastify.get('/', async (request, reply) => {
  const users = [
    { name: 'tobi', email: 'tobi@learnboost.com' },
    { name: 'loki', email: 'loki@learnboost.com' },
    { name: 'jane', email: 'jane@learnboost.com' },
  ];
  return reply.view("/views/users.html", {
    users: users,
    title: "EJS example",
    header: "Some users",
   });
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
