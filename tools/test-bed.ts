import { ContextService } from '@/src/commons/context.service.js';
import { CONFIG } from '@/src/config/config-loader.js';
import { type Config } from '@/src/config/types.js';
import { container } from '@/src/inversify.config.js';
import { LoadProject } from '@/src/middlewares/load-project.js';
import { buildCommandModule, getCommandOpts, type ICommand } from '@/src/modules/command.js';
import { type IMiddleware } from '@/src/modules/middleware.js';
import { getRegistry } from '@/src/modules/module.js';
import { type Project } from '@/src/projects/project.js';
import { Workspace } from '@/src/projects/workspace.js';
import { type Class } from '@/src/types.js';
import { type PackageManager } from '@/src/utils/types.js';
import { ContainerModule } from 'inversify';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { type Package } from 'normalize-package-data';
import { type CommandModule } from 'yargs';
import { TestProject } from './test-project.js';
import { TestWorkspace } from './test-workspace.js';
import { shell } from './utils.js';

// Bed
export class TestBed {
  // Attributes
  private _config: Config = {
    hooks: true,
    jobs: 1,
  };

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id: _, ...manifest } = wks.manifest;
    await fs.promises.writeFile(path, JSON.stringify(manifest));
  }

  /**
   * Loads command, and mock LoadProject & LoadWorkspace middlewares
   *
   * @param command Command to prepare
   * @param within project or workspace where the comme will be run
   */
  async prepareCommand(command: Class<ICommand>, within: Project | Workspace = this.project): Promise<CommandModule> {
    // Load metadata
    const opts = getCommandOpts(command);
    const registry = getRegistry(command);

    // Create command
    container.load(new ContainerModule(registry));
    const cmd = await container.getAsync<ICommand>(command);

    // Inject mocks
    const prj = within instanceof Workspace ? within.project : within;

    container.rebind<IMiddleware>(LoadProject).toConstantValue({
      handler() {
        container.get(ContextService).project = prj;
      }
    });

    return buildCommandModule(cmd, opts);
  }

  /**
   * Create project's structure inside a temporary directory
   */
  async createProjectDirectory(): Promise<string> {
    // Ensure tmp dir exists (for mocked fs)
    await fs.promises.mkdir(os.tmpdir(), { recursive: true });

    let tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jill-test-'));

    // Corrects path on macOS => see https://github.com/nodejs/node/issues/11422
    tmp = await fs.promises.realpath(tmp);

    // Create project directory
    const prjDir = path.join(tmp, 'test');

    await fs.promises.mkdir(prjDir);
    await this.writeManifest(path.join(prjDir, 'package.json'), await this.project.mainWorkspace());

    // Add config file
    await fs.promises.writeFile(path.join(prjDir, '.jillrc.json'), JSON.stringify(this._config));

    // Create workspaces
    for await (const wks of this.project.workspaces()) {
      const wksDir = path.join(prjDir, wks.name);

      await fs.promises.mkdir(wksDir);
      await this.writeManifest(path.join(wksDir, 'package.json'), wks);
    }

    return prjDir;
  }

  /**
   * Create project's structure inside a temporary directory and generates the lock file
   */
  async createProjectPackage(pm: PackageManager): Promise<string> {
    const prjDir = await this.createProjectDirectory();

    // Run package manager
    switch (pm) {
      case 'npm':
        await shell('npm install --no-audit', { cwd: prjDir });
        break;

      case 'yarn':
        await shell('yarn install --no-immutable', { cwd: prjDir });
        break;
    }

    return prjDir;
  }

  // Properties
  get config(): Readonly<Config> {
    return this._config;
  }

  set config(config) {
    this._config = config;

    container.rebind(CONFIG).toConstantValue(config);
  }
}
