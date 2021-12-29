import { Workspace } from '@jujulego/jill-core';
import { Repeater } from '@repeaterjs/repeater';

import { Filter } from './filters';

// Class
export class Pipeline {
  // Attributes
  private _filters: Filter[] = [];

  // Methods
  add(filter: Filter): void {
    this._filters.push(filter);
  }

  private async _test(workspace: Workspace): Promise<boolean> {
    for (const filter of this._filters) {
      const res = await filter.test(workspace);

      if (!res) {
        return false;
      }
    }

    return true;
  }

  filter(workspaces: AsyncGenerator<Workspace>): Repeater<Workspace> {
    return new Repeater(async (push, stop) => {
      const proms: Promise<unknown>[] = [];

      for await (const wks of workspaces) {
        proms.push(this._test(wks)
          .then((res) => {
            if (res) push(wks);
          })
        );
      }

      await Promise.all(proms);
      stop();
    });
  }
}