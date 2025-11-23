import { Workspace } from '@/src/projects/workspace.js';

// Class
export class TestWorkspace extends Workspace {
  // Attributes
  private readonly _dependencies: Workspace[] = [];
  private readonly _devDependencies: Workspace[] = [];

  // Methods
  addDependency(wks: Workspace, dev = false): this {
    if (dev) {
      this._devDependencies.push(wks);

      this.manifest.devDependencies ??= {};
      this.manifest.devDependencies[wks.name] = wks.version;
    } else {
      this._dependencies.push(wks);

      this.manifest.dependencies ??= {};
      this.manifest.dependencies[wks.name] = wks.version;
    }

    return this;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async* dependencies(): AsyncGenerator<Workspace, void> {
    for (const wks of this._dependencies) {
      yield wks;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async* devDependencies(): AsyncGenerator<Workspace, void> {
    for (const wks of this._devDependencies) {
      yield wks;
    }
  }
}
