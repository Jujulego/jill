import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import '@/src/commons/logger.service.js';
import { TestBed } from '@/tools/test-bed.js';

import { jill } from './utils.js';

// Constants
// language=javascript
const PLUGIN_CODE = `
import { Command, Plugin } from ${JSON.stringify(url.pathToFileURL(path.resolve(__dirname, '../dist/index.js')))};

// Command
class TestCommand {
  handler() {
    console.log('this is a test plugin !');
  }
}

Command({
  command: 'test',
  describe: 'Plugin test command'
})(TestCommand);

// Plugin
class TestPlugin {}

Plugin({
  name: 'test',
  commands: [
    TestCommand
  ]
})(TestPlugin);

export default TestPlugin;
`;

// Setup
const bed = new TestBed();

bed.config = {
  plugins: ['./plugin.mjs']
};

// Tests
describe('jill test (command from plugin)', () => {
  describe.each(['npm', 'yarn'] as const)('using %s', (packageManager) => {
    // Setup
    let baseDir: string;
    let tmpDir: string;
    let prjDir: string;

    beforeAll(async () => {
      baseDir = await bed.createProjectPackage(packageManager);
      tmpDir = path.dirname(baseDir);

      // Add plugin code
      await fs.writeFile(path.join(baseDir, 'plugin.mjs'), PLUGIN_CODE);
    }, 15000);

    beforeEach(async (ctx) => {
      prjDir = path.join(tmpDir, ctx.task.id);

      await fs.cp(baseDir, prjDir, { force: true, recursive: true });
    });

    afterAll(async () => {
      await fs.rm(tmpDir, { recursive: true });
    });

    // Tests
    it('should run command loaded from plugin file', async () => {
      const res = await jill('test', { cwd: prjDir });

      expect(res.stdout).toEqual([
        'this is a test plugin !'
      ]);
    });
  });
}, { timeout: 10000 });
