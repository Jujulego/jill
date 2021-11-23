import { mergeSchemas } from '@graphql-tools/schema';
import { JSONObjectDefinition } from 'graphql-scalars';

import { ControlSchema } from './control/control.schema';
import { TasksSchema } from './tasks/tasks.schema';

// Schema
export const schema = mergeSchemas({
  typeDefs: [
    JSONObjectDefinition
  ],
  schemas: [
    ControlSchema,
    TasksSchema,
  ]
});
