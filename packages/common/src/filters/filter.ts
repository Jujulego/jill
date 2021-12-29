import { Workspace } from '@jujulego/jill-core';

// Class
export class Filter {
  // Constructor
  constructor(
    private _predicate?: (workspace: Workspace) => boolean
  ) {}

  // Statics
  static privateWorkspace(value: boolean): Filter {
    return new Filter((wks) => (wks.manifest.private ?? false) === value);
  }

  static scripts(values: string[]): Filter {
    return new Filter((wks) => {
      const scripts = Object.keys(wks.manifest.scripts || {});
      return values.some(scr => scripts.includes(scr));
    });
  }

  // Methods
  async test(workspace: Workspace): Promise<boolean> {
    if (!this._predicate) return true;
    return this._predicate(workspace);
  }
}