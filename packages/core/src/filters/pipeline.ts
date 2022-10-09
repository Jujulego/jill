import { Workspace } from '../project';

import { Filter } from './filter';

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

  async *filter(workspaces: AsyncGenerator<Workspace>): AsyncGenerator<Workspace> {
    for await (const wks of workspaces) {
      if (await this._test(wks)) {
        yield wks;
      }
    }
  }
}
