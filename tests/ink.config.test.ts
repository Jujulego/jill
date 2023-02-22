import { render } from 'ink';
import wt from 'node:worker_threads';

import { INK_APP } from '@/src/ink.config';
import { container } from '@/src/inversify.config';

// Setup
jest.mock('ink');
jest.mock('node:worker_threads', () => ({
  isMainThread: true,
}));


beforeEach(() => {
  container.snapshot();

  jest.resetAllMocks();
  jest.restoreAllMocks();

  Object.assign(wt, { isMainThread: true });
});

afterEach(() => {
  container.restore();
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
