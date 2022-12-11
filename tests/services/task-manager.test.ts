import { TaskManager } from '@jujulego/tasks';

import { container, GLOBAL_CONFIG } from '@/src/services';

// Tests
describe('TaskManager', () => {
  beforeEach(() => {
    container.snapshot();
  });

  afterEach(() => {
    container.restore();
  });

  // Tests
  it('should set jobs from GLOBAL_CONFIG', () => {
    container.rebind(GLOBAL_CONFIG)
      .toConstantValue({ verbose: 0, jobs: 5 });

    const manager = container.get(TaskManager);

    expect(manager.jobs).toBe(5);
  });
});
