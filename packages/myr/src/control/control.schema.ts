import { makeExecutableSchema } from '@graphql-tools/schema';

import { ControlResolvers } from './control.resolvers';

// Schema
export const ControlSchema = makeExecutableSchema({
  typeDefs: /* GraphQL */`
      type Mutation {
          shutdown: Boolean!
      }
  `,
  resolvers: ControlResolvers
});