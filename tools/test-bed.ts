import { Package } from 'normalize-package-data';
import cp from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { TestProject } from './test-project';
import { TestWorkspace } from './test-workspace';
import { Workspace } from '../src/project';

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
    const wks = new TestWorkspace(`./${name}`, this.manifest({ _id: `${name}-id`, name, ...pkg }), this.project);
    this.project.addWorkspace(wks);

    return wks;
  }

  async writeManifest(path: string, wks: Workspace): Promise<void> {
    const { _id: _, ...manifest } = wks.manifest;
    await fs.writeFile(path, JSON.stringify(manifest, null, 2));
  }

  async createProjectDirectory(): Promise<string> {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'jill-test-'));

    // Create project directory
    const prjDir = path.join(tmp, 'test');

    await fs.mkdir(prjDir);
    await this.writeManifest(path.join(prjDir, 'package.json'), await this.project.mainWorkspace());

    // Create workspaces
    for await (const wks of this.project.workspaces()) {
      const wksDir = path.join(prjDir, wks.name);

      await fs.mkdir(wksDir);
      await this.writeManifest(path.join(wksDir, 'package.json'), wks);
    }

    // Run package manager
    await new Promise<void>((resolve, reject) => {
      const proc = cp.spawn('yarn', ['install'], {
        cwd: prjDir,
        shell: true,
        windowsHide: true
      });

      let stderr = '';

      proc.stderr.on('data', (msg: Buffer) => {
        stderr = stderr + msg.toString('utf-8');
      });

      proc.on('close', (code) => {
        if (code) {
          reject(new Error(`yarn failed with code ${code}:\n${stderr}`));
        } else {
          resolve();
        }
      });

      proc.on('error', reject);
    });

    return prjDir;
  }
}
