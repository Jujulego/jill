import { Package } from 'normalize-package-data';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { CONFIG } from '@/src/config/config-loader';
import { IConfig } from '@/src/config/types';
import { container } from '@/src/inversify.config';
import { Workspace } from '@/src/project/workspace';

import { TestProject } from './test-project';
import { TestWorkspace } from './test-workspace';
import { shell } from './utils';

// Bed
export class TestBed {
  // Attributes
  private _config: IConfig = {};

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
    await fs.writeFile(path, JSON.stringify(manifest));
  }

  /**
   * Create project's structure inside a temporary directory
   */
  async createProjectDirectory(): Promise<string> {
    // Ensure tmp dir exists (for mocked fs)
    await fs.mkdir(os.tmpdir(), { recursive: true });

    let tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'jill-test-'));

    // Corrects path on macOS => see https://github.com/nodejs/node/issues/11422
    tmp = await fs.realpath(tmp);

    // Create project directory
    const prjDir = path.join(tmp, 'test');

    await fs.mkdir(prjDir);
    await this.writeManifest(path.join(prjDir, 'package.json'), await this.project.mainWorkspace());

    // Add config file
    await fs.writeFile(path.join(prjDir, '.jillrc.json'), JSON.stringify(this._config));

    // Create workspaces
    for await (const wks of this.project.workspaces()) {
      const wksDir = path.join(prjDir, wks.name);

      await fs.mkdir(wksDir);
      await this.writeManifest(path.join(wksDir, 'package.json'), wks);
    }

    return prjDir;
  }

  /**
   * Create project's structure inside a temporary directory and generates the lock file
   */
  async createProjectPackage(): Promise<string> {
    const prjDir = await this.createProjectDirectory();

    // Run package manager
    await shell('yarn', ['install', '--no-immutable'], { cwd: prjDir });

    return prjDir;
  }

  // Properties
  get config(): Readonly<IConfig> {
    return this._config;
  }

  set config(config) {
    this._config = config;

    container.rebind(CONFIG).toConstantValue(config);
  }
}
