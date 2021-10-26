import express from 'express';
import { graphqlHTTP } from 'express-graphql';

import { logger } from './logger';
import { resolvers } from './resolvers';
import { schema } from './schema';

// Bootstrap
(async () => {
  const app = express();

  if (process.env.NODE_ENV === 'development') {
    const { default: playground } = await import('graphql-playground-middleware-express');

    app.get('/graphql', playground({
      endpoint: '/graphql'
    }));

    logger.verbose('Server will serve graphql-playground');
  }

  app.use('/graphql', graphqlHTTP({
    schema,
    rootValue: resolvers,
    graphiql: false,
  }));

  app.listen(4000, () => {
    logger.info('Server is accessible at http://localhost:4000/graphql');
  });
})();