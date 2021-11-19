import { mergeSchemas } from '@graphql-tools/schema';

import { ControlSchema } from './control/control.schema';
import { TasksSchema } from './tasks/tasks.schema';

// Schema
export const schema = mergeSchemas({
  schemas: [
    ControlSchema,
    TasksSchema,
  ]
});
