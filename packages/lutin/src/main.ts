import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { useServer } from 'graphql-ws/lib/use/ws';
import ws from 'ws';

import { logger } from './logger';
import { resolvers } from './resolvers';
import { schema } from './schema';

// Bootstrap
(async () => {
  const app = express();

  if (process.env.NODE_ENV === 'development') {
    const { default: playground } = await import('graphql-playground-middleware-express');

    app.get('/graphql', playground({
      endpoint: '/graphql',
      subscriptionEndpoint: 'ws://localhost:4000/graphql'
    }));

    logger.verbose('Server will serve graphql-playground');
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