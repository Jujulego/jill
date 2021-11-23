import { mergeResolvers } from '@graphql-tools/merge';
import { JSONObjectResolver } from 'graphql-scalars';

import { ControlResolvers } from './control/control.resolvers';
import { TasksResolvers } from './tasks/tasks.resolvers';

// Resolvers
export const resolvers = mergeResolvers([
  { JSONObjectResolver },
  ControlResolvers,
  TasksResolvers
]);
