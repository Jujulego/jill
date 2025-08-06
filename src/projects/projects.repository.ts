import { inject$ } from '@kyrielle/injector';
import { withLabel } from '@kyrielle/logger';
import path from 'node:path';
import { LOGGER, PATH_SCURRY } from '../tokens.js';
import { Project, type ProjectOptions } from './project.js';

/**
 * Helps detecting projects folders
 */
export class ProjectsRepository {
  // Attributes
  private readonly _cache = new Map<string, Project>();
  private readonly _logger = inject$(LOGGER).child(withLabel('projects'));
  private readonly _scurry = inject$(PATH_SCURRY);

  // Methods
  async isProjectRoot(dir: string): Promise<IsProjectRoot> {
    this._logger.debug`testing ${dir}`;
    const files = await this._scurry.readdir(dir, { withFileTypes: false });

    return {
      hasManifest: files.includes(MANIFEST),
      hasLockFile: LOCK_FILES.some((lock) => files.includes(lock)),
    };
  }

  async searchProjectRoot(directory: string): Promise<string> {
    directory = path.resolve(directory);

    // Test all ancestors
    const steps: string[] = [];
    let foundManifest = false;
    let projectRoot = directory;
    let dir = directory;
    let prev = dir;

    do {
      // Look for files
      const { hasManifest, hasLockFile } = await this.isProjectRoot(dir);
      steps.push(dir);

      if (hasManifest) {
        projectRoot = dir;
        foundManifest = true;
      }

      if (hasLockFile) {
        break;
      }

      prev = dir;
      dir = path.dirname(dir);
    } while (prev !== dir);

    // Log it
    if (foundManifest) {
      this._logger.verbose`project root found at ${projectRoot}`;
    } else {
      this._logger.verbose`project root not found, keeping ${projectRoot}`;
    }

    return projectRoot;
  }

  getProject(root: string, opts?: ProjectOptions): Project {
    let project = this._cache.get(root);

    if (!project) {
      project = new Project(root, opts);
      this._cache.set(root, project);
    }

    return project;
  }
}

// Constants
const MANIFEST = 'package.json';
const LOCK_FILES = ['package-lock.json', 'yarn.lock'];

// Types
export interface IsProjectRoot {
  hasManifest: boolean;
  hasLockFile: boolean;
}
