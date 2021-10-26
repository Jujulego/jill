import { mergeResolvers } from '@graphql-tools/merge';

import { TasksResolvers } from './tasks/tasks.resolvers';

// Resolvers
export const resolvers = mergeResolvers(TasksResolvers);
