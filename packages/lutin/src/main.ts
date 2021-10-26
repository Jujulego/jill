import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';

// Graphql schema
const schema = buildSchema(`
  type Query {
    hello: String
  }
`);

// Resolvers
const resolvers = {
  hello: () => {
    return 'Hello world!';
  }
};

// Server
const app = express();
app.use('/graphql', graphqlHTTP({
  schema,
  rootValue: resolvers,
  graphiql: true,
}));

app.listen(4000);