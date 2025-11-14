import { isPrivate$ } from '@/src/projects/filters/is-private.js';
import { TestBed } from '@/tools/test-bed.js';
import { asyncIterator$, collect$, pipe$, waitFor$ } from 'kyrielle';
import { beforeEach, describe, expect, it } from 'vitest';

// Setup
let bed: TestBed;

beforeEach(() => {
  bed = new TestBed();
});

// Tests
describe('isPrivate$', () => {
  it('should only keep the private workspace (public by default)', async () => {
    const workspaces = [
      bed.addWorkspace('wks-1'),
      bed.addWorkspace('wks-2', { private: false }),
      bed.addWorkspace('wks-3', { private: true }),
    ];

    await expect(waitFor$(pipe$(asyncIterator$(workspaces), isPrivate$(true), collect$())))
      .resolves.toStrictEqual([
        workspaces[2],
      ]);
  });

  it('should only keep the public workspaces (public by default)', async () => {
    const workspaces = [
      bed.addWorkspace('wks-1'),
      bed.addWorkspace('wks-2', { private: false }),
      bed.addWorkspace('wks-3', { private: true }),
    ];

    await expect(waitFor$(pipe$(asyncIterator$(workspaces), isPrivate$(false), collect$())))
      .resolves.toStrictEqual([
        workspaces[0],
        workspaces[1],
    ]);
  });
});
