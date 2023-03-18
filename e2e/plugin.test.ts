import fs from 'node:fs/promises';
import path from 'node:path';

import { jill, withPackageManager } from './utils';
import { TestBed } from '@/tools/test-bed';

describe('jill test (command from plugin)', () => void withPackageManager((packageManager) => {
  // Setup
  let prjDir: string;

  beforeEach(async () => {
    // Create project directory
    const bed = new TestBed();
    bed.config = {
      plugins: ['./plugin.js']
    };

    prjDir = await bed.createProjectPackage(packageManager);

    // Add plugin code
    await fs.writeFile(path.join(prjDir, 'plugin.js'),
      // language=javascript
      `
const { Command, Plugin } = require(${JSON.stringify(path.resolve(__dirname, '../dist'))}); // require('jill');

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

module.exports = { default: TestPlugin };
`);
  });

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
}));
