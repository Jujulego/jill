import { makeExecutableSchema } from '@graphql-tools/schema';
import gql from 'graphql-tag';

import { resolvers } from './resolvers';

// Schema
export const schema = makeExecutableSchema({
  typeDefs: gql`
      type Query {
          hello: String
      }
      
      type Subscription {
          greetings: String
      }
  `,
  resolvers
});