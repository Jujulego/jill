import fs from 'node:fs/promises';
import path from 'node:path';
import { inject } from 'inversify';

import { Logger } from '@/src/commons/logger.service';
import { Service } from '@/src/modules/service';

// Constants
const MANIFEST = 'package.json';
const LOCK_FILES = ['package-lock.json', 'yarn.lock'];

// Types
export interface IsProjectRoot {
  hasManifest: boolean;
  hasLockFile: boolean;
}

// Class
@Service()
export class ProjectRepository {
  // Attributes
  private readonly _roots = new Map<string, string>();

  // Constructor
  constructor(
    @inject(Logger)
    private readonly logger: Logger,
  ) {}

  // Methods
  async isProjectRoot(dir: string): Promise<IsProjectRoot> {
    const files = await fs.readdir(dir);

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
      // Check cache
      const root = this._roots.get(dir);

      if (root) {
        projectRoot = root;
        foundManifest = true;
        break;
      }

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

    // Cache result
    for (const dir of steps) {
      if (dir.startsWith(projectRoot)) {
        this._roots.set(dir, projectRoot);
      }
    }

    // Log it
    if (foundManifest) {
      this.logger.debug(`Project root found at ${path.relative(process.cwd(), projectRoot) || '.'}`);
    } else {
      this.logger.debug(`Project root not found, keeping ${path.relative(process.cwd(), projectRoot) || '.'}`);
    }

    return projectRoot;
  }
}