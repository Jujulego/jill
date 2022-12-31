import { Workspace } from '@/src/project/workspace';
import { Awaitable } from '@/src/types';

// Interface
export interface PipelineFilter {
  // Methods
  test(workspace: Workspace): Awaitable<boolean>;
}

// Class
export class Pipeline {
  // Attributes
  private _filters: PipelineFilter[] = [];

  // Methods
  add(filter: PipelineFilter): void {
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

  async *filter(workspaces: Iterable<Workspace> | AsyncIterable<Workspace>): AsyncGenerator<Workspace> {
    for await (const wks of workspaces) {
      if (await this._test(wks)) {
        yield wks;
      }
    }
  }
}
