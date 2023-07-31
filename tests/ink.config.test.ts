import { render } from 'ink';
import wt from 'node:worker_threads';
import { vi } from 'vitest';

import { INK_APP } from '@/src/ink.config';
import { container } from '@/src/inversify.config';

// Setup
vi.mock('ink');

beforeEach(() => {
  container.snapshot();

  vi.resetAllMocks();
  vi.restoreAllMocks();
});

afterEach(() => {
  container.restore();

  Object.assign(wt, { isMainThread: true });
});

// Tests
describe('INK_APP', () => {
  it('should call render on stdout', () => {
    Object.assign(process.stdout, { isTTY: true });

    container.get(INK_APP);

    expect(render).toHaveBeenCalledWith(expect.anything(), { stdout: process.stdout });
  });

  it('should call render on stderr if stdout is not a tty', () => {
    Object.assign(process.stdout, { isTTY: false });

    container.get(INK_APP);

    expect(render).toHaveBeenCalledWith(expect.anything(), { stdout: process.stderr });
  });

  it('should fail outside of main thread', () => {
    Object.assign(wt, { isMainThread: false });

    expect(() => container.get(INK_APP))
      .toThrow(new Error('Ink should only be used in main thread'));

    expect(render).not.toHaveBeenCalled();
  });
});
