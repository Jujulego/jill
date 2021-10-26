import { makeExecutableSchema } from '@graphql-tools/schema';
import gql from 'graphql-tag';

import { TasksResolvers } from './tasks.resolvers';

// Schema
export const TasksSchema = makeExecutableSchema({
  typeDefs: gql`
      type Task {
          id: String!
          cmd: String!
          args: [String!]!
          status: TaskStatus!
          options: TaskOptions
      }
      
      enum TaskStatus {
          ready
          running
          done
          failed
      }
      
      type TaskOptions {
          cwd: String
      }
      
      type Query {
          tasks: [Task!]!
      }
  `,
  resolvers: TasksResolvers
});