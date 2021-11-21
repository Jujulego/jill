import { makeExecutableSchema } from '@graphql-tools/schema';

import { ControlResolvers } from './control.resolvers';

// Schema
export const ControlSchema = makeExecutableSchema({
  typeDefs: /* GraphQL */`
      """JSON data"""
      scalar Log
      
      type Query {
          logs(start: Int, limit: Int): [Log!]!
      }
      
      type Mutation {
          shutdown: Boolean!
      }
  `,
  resolvers: ControlResolvers
});