import { render } from 'ink';
import wt from 'node:worker_threads';
import { vi } from 'vitest';

import { INK_APP } from '@/src/ink.config.tsx';
import { container } from '@/src/inversify.config.ts';

// Setup
vi.mock('ink');

beforeEach(() => {
  container.snapshot();

  vi.restoreAllMocks();
});

afterEach(() => {
  container.restore();

  Object.assign(wt, { isMainThread: true });
});

// Tests
describe('INK_APP', () => {
  it('should call render on stdout', () => {
    container.get(INK_APP);

    expect(render).toHaveBeenCalledWith(expect.anything());
  });

  it('should fail outside of main thread', () => {
    Object.assign(wt, { isMainThread: false });

    expect(() => container.get(INK_APP))
      .toThrow(new Error('Ink should only be used in main thread'));

    expect(render).not.toHaveBeenCalled();
  });
});
