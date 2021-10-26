import { mergeSchemas } from '@graphql-tools/schema';

import { TasksSchema } from './tasks/tasks.schema';

// Schema
export const schema = mergeSchemas({
    schemas: [
      TasksSchema
    ]
});
