import { IResolvers } from '@graphql-tools/utils';

// Resolvers
export const ControlResolvers: IResolvers = {
  Mutation: {
    shutdown(): boolean {
      return true;
    }
  }
};