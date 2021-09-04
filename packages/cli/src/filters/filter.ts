import { Workspace } from '@jujulego/jill-core';

// Class
export abstract class Filter {
  // Methods
  abstract test(workspace: Workspace): Promise<boolean>;
}