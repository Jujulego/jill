import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

import { jill } from './utils';
import { TestBed } from '@/tools/test-bed';

describe('jill test (command from plugin)', () => {
  describe.each(['npm', 'yarn'] as const)('using %s', (packageManager) => {
    // Setup
    let prjDir: string;

    beforeEach(async () => {
      // Create project directory
      const bed = new TestBed();
      bed.config = {
        plugins: ['./plugin.mjs']
      };

      prjDir = await bed.createProjectPackage(packageManager);
      const jillPath = url.pathToFileURL(path.resolve(__dirname, '../dist/index.mjs'));

      // Add plugin code
      await fs.writeFile(path.join(prjDir, 'plugin.mjs'),
        // language=javascript
        `
import { Command, Plugin } from ${JSON.stringify(jillPath)};

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
`);
    }, 15000);

    afterEach(async () => {
      await fs.rm(prjDir, { recursive: true });
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
