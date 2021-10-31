import { makeExecutableSchema } from '@graphql-tools/schema';
import gql from 'graphql-tag';

import { TasksResolvers } from './tasks.resolvers';

// Schema
export const TasksSchema = makeExecutableSchema({
  typeDefs: gql`
      type Task {
          "Task unique id"
          id: ID!
          "Task working directory"
          cwd: String!
          "Task command"
          cmd: String!
          "Task command arguments"
          args: [String!]!
          "Task current status"
          status: TaskStatus!
      }
      
      enum TaskStatus {
          "Task is blocked by it's dependencies"
          blocked
          "Task is ready to start"
          ready
          "Task is currently running"
          running
          "Task has successfully finished"
          done
          "Task ended with an error code"
          failed
      }
      
      type Query {
          task(id: ID!): Task!
          tasks: [Task!]!
      }
      
      type Mutation {
          spawn(cwd: String!, cmd: String!, args: [String!]): Task!
      }
  `,
  resolvers: TasksResolvers
});