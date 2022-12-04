import { Workspace } from '../src/project';

// Class
export class TestWorkspace extends Workspace {
  // Attributes
  private readonly _dependencies: Workspace[] = [];
  private readonly _devDependencies: Workspace[] = [];

  // Methods
  addDependency(wks: Workspace, dev = false): this {
    if (dev) {
      this._devDependencies.push(wks);
    } else {
      this._dependencies.push(wks);
    }

    return this;
  }

  override async* dependencies(): AsyncGenerator<Workspace, void> {
    for (const wks of this._dependencies) {
      yield wks;
    }
  }

  override async* devDependencies(): AsyncGenerator<Workspace, void> {
    for (const wks of this._devDependencies) {
      yield wks;
    }
  }
}
