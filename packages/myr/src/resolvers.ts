import { mergeResolvers } from '@graphql-tools/merge';

import { ControlResolvers } from './control/control.resolvers';
import { TasksResolvers } from './tasks/tasks.resolvers';

// Resolvers
export const resolvers = mergeResolvers([
  ControlResolvers,
  TasksResolvers
]);
