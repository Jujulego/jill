import { Package } from 'normalize-package-data';

import { TestProject } from './test-project';
import { TestWorkspace } from './test-workspace';

// Bed
export class TestBed {
  // Attributes
  readonly project = new TestProject('./test');

  // Methods
  manifest(pkg: Partial<Package>): Package {
    return {
      _id: 'test-id',
      name: 'test',
      version: '1.0.0',
      readme: 'readme',
      ...pkg
    };
  }

  addWorkspace(name: string, pkg: Partial<Package> = {}): TestWorkspace {
    const wks = new TestWorkspace(`${this.project.root}/${name}`, this.manifest({ name, ...pkg }), this.project);
    this.project.addWorkspace(wks);

    return wks;
  }
}
