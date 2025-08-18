import { hasEveryScript$, hasSomeScript$ } from '@/src/cli/filters/has-scripts.js';
import { TestBed } from '@/tools/test-bed.js';
import { asyncIterator$, collect$, pipe$, waitFor$ } from 'kyrielle';
import { beforeEach, describe, expect, it } from 'vitest';

// Setup
let bed: TestBed;

beforeEach(() => {
  bed = new TestBed();
});

// Tests
describe('hasSomeScript$', () => {
  it('should only keep the workspace having the script', async () => {
    const workspaces = [
      bed.addWorkspace('wks-1'),
      bed.addWorkspace('wks-2', { scripts: { lint: 'eslint' } }),
      bed.addWorkspace('wks-3', { scripts: { lint: 'eslint', test: 'vitest' } }),
    ];

    await expect(waitFor$(pipe$(asyncIterator$(workspaces), hasSomeScript$(['lint']), collect$())))
      .resolves.toStrictEqual([
        workspaces[1],
        workspaces[2],
      ]);
  });
});

describe('hasEveryScript$', () => {
  it('should only keep the workspace having the script', async () => {
    const workspaces = [
      bed.addWorkspace('wks-1'),
      bed.addWorkspace('wks-2', { scripts: { lint: 'eslint' } }),
      bed.addWorkspace('wks-3', { scripts: { lint: 'eslint', test: 'vitest' } }),
    ];

    await expect(waitFor$(pipe$(asyncIterator$(workspaces), hasEveryScript$(['lint', 'test']), collect$())))
      .resolves.toStrictEqual([
        workspaces[2],
      ]);
  });
});
