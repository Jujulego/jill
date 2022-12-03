import { Package } from 'normalize-package-data';

import { Project, Workspace } from '../src/project';

// Bed
export class TestBed {
  // Attributes
  readonly project = new Project('./test');

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

  workspace(name: string, pkg: Partial<Package> = {}): Workspace {
    return new Workspace(`${this.project.root}/${name}`, this.manifest({ name, ...pkg }), this.project);
  }
}
