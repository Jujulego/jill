import { makeExecutableSchema } from '@graphql-tools/schema';

import { ControlResolvers } from './control.resolvers';

// Schema
export const ControlSchema = makeExecutableSchema({
  typeDefs: /* GraphQL */`
      scalar JSONObject
      
      type Query {
          logs(start: Int, limit: Int): [JSONObject!]!
      }
      
      type Mutation {
          shutdown: Boolean!
      }
  `,
  resolvers: ControlResolvers
});