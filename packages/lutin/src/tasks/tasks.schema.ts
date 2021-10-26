import { makeExecutableSchema } from '@graphql-tools/schema';
import gql from 'graphql-tag';

import { TasksResolvers } from './tasks.resolvers';

// Schema
export const TasksSchema = makeExecutableSchema({
  typeDefs: gql`
      type Task {
          cmd: String!
          args: [String!]!
          cwd: String!
          status: TaskStatus!
      }
      
      enum TaskStatus {
          ready
          running
          done
          failed
      }
      
      type Query {
          tasks: [Task!]!
      }
  `,
  resolvers: TasksResolvers
});