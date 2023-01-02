import fs from 'node:fs/promises';
import path from 'node:path';

import { TestBed } from '@/tools/test-bed';

import { jill } from './utils';

// Setup
let prjDir: string;

beforeEach(async () => {
  // Create project directory
  const bed = new TestBed();
  bed.config = {
    plugins: ['./plugin.js']
  };

  prjDir = await bed.createProjectPackage();

  // Add plugin code
  await fs.writeFile(path.join(prjDir, 'plugin.js'),
    // language=javascript
    `
module.exports = {
  builder(yargs) {
    yargs.command('test', 'toto', {}, () => console.log('this is a test plugin !'));
  }
};
`);
});

afterEach(async () => {
  await fs.rm(prjDir, { recursive: true });
});

// Tests
describe('jill test (command from plugin)', () => {
  it('should run command loaded from plugin file', async () => {
    const res = await jill(['test'], { cwd: prjDir });

    expect(res.stdout).toEqual([
      'this is a test plugin !'
    ]);
  });
});
