import Fastify from "fastify";
import fastifyEjs from "@fastify/view";
import * as ejs from "ejs";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyFormBody from "@fastify/formbody";
import bkfd2Password from "pbkdf2-password";
const hash = bkfd2Password();

const fastify = Fastify({
  logger: true,
});
const port = 3000;

// Register template engine
fastify.register(fastifyEjs, {
  engine: {
    ejs: ejs,
  },
});

fastify.register(fastifyFormBody);
fastify.register(fastifyCookie);
fastify.register(fastifySession, {
  cookieName: 'sessionId',
  saveUninitialized: false, // don't create session until something stored
  secret: 'shhhh, a secret with minimum length of 32 characters',
  cookie: { secure: false },
  expires: 1800000,
});

fastify.addHook('preHandler', (request, reply, next) => {
  console.log(`Session: ${JSON.stringify(request.session)}`);
  const err = request.session.error;
  const msg = request.session.success;
  delete request.session.error;
  delete request.session.success;
  reply.locals = {
    message: ''
  };
  if (err) reply.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) reply.locals.message = '<p class="msg success">' + msg + '</p>';
  next();
});

// dummy database

const users = {
  tj: { name: 'tj' }
};

// when you create a user, generate a salt
// and hash the password ('foobar' is the pass here)

hash({ password: 'foobar' }, function (err, pass, salt, hash) {
  if (err) throw err;
  // store the salt & hash in the "db"
  users.tj.salt = salt;
  users.tj.hash = hash;
});


// Authenticate using our plain-object database of doom!
const authenticate = async (name, pass, fn) => {
  var user = users[name];
  // query the db for the given username
  if (!user) return fn(null, null)
  // apply the same algorithm to the POSTed password, applying
  // the hash against the pass / salt, if there is a match we
  // found the user
  hash({ password: pass, salt: user.salt }, function (err, pass, salt, hash) {
    if (err) return fn(err);
    if (hash === user.hash) return fn(null, user)
    fn(null, null)
  });
}

function restrict(request, reply, next) {
  if (request.session.user) {
    next();
  } else {
    request.session.error = 'Access denied!';
    reply.redirect('/login');
  }
}

// Declare a route

fastify.get('/', function(request, reply){
  reply.redirect('/login');
});

fastify.route({
  method: 'GET',
  url: '/restricted',
  onRequest: restrict,
  handler: function(request, reply) {
    reply.send('Wahoo! restricted area, click to <a href="/logout">logout</a>');
  },
});

fastify.get('/logout', function(request, reply){
  // destroy the user's session to log them out
  // will be re-created next request
  request.session.destroy(function(){
    reply.redirect('/');
  });
});

fastify.get('/login', function(request, reply){
  reply.view('/views/login.ejs');
});

fastify.post('/login', function (request, reply, next) {
  authenticate(request.body.username, request.body.password, function(err, user){
    if (err) return next(err)
    if (user) {
      // Regenerate session when signing in
      // to prevent fixation
      request.session.regenerate(function(){
        // Store the user's primary key
        // in the session store to be retrieved,
        // or in this case the entire user object
        request.session.user = user;
        request.session.success = 'Authenticated as ' + user.name
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';
        reply.redirect('/restricted');
      });
    } else {
      request.session.error = 'Authentication failed, please check your '
        + ' username and password.'
        + ' (use "tj" and "foobar")';
      reply.redirect('/login');
    }
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
