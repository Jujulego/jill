import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { useServer } from 'graphql-ws/lib/use/ws';
import ws from 'ws';

import { logger } from './logger';
import { resolvers } from './resolvers';
import { schema } from './schema';
import { PidFile } from './pidfile';

// Bootstrap
(async () => {
  // Lock pid file
  const pidfile = new PidFile();

  if (!await pidfile.create()) {
    process.exit(1);
  }

  // Shutdown
  function handleShutdown() {
    logger.info('Shutdown signal received');
    pidfile.delete();
  }

  process.once('SIGTERM', handleShutdown);
  process.once('SIGINT', handleShutdown);
  process.once('SIGUSR1', handleShutdown);
  process.once('SIGUSR2', handleShutdown);

  // Stat express
  const app = express();

  if (process.env.NODE_ENV === 'development') {
    const { default: playground } = await import('graphql-playground-middleware-express');

    app.get('/graphql', playground({
      endpoint: '/graphql',
      subscriptionEndpoint: 'ws://localhost:4000/graphql'
    }));

    logger.verbose('Will serve graphql-playground');
  }

  app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: resolvers,
    graphiql: false,
  }));

  const server = app.listen(4000, () => {
    const wsServer = new ws.Server({ server, path: '/graphql' });
    useServer({ schema }, wsServer);

    logger.info('Server is accessible at http://localhost:4000/graphql');
  });
})();