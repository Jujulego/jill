import express from 'express';
import { graphqlHTTP } from 'express-graphql';

import { resolvers } from './resolvers';
import { schema } from './schema';

// Server
const app = express();
app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: resolvers,
  graphiql: true,
}));

app.listen(4000);