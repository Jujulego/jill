import '@/src/commons/logger.service.js';
import { container } from '@/src/inversify.config.js';
import { CONFIG } from '@/src/config/config-loader.js';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config.js';

// Tests
describe('TaskManager', () => {
  beforeEach(() => {
    container.snapshot();
  });

  afterEach(() => {
    container.restore();
  });

  // Tests
  it('should set jobs from CONFIG', () => {
    container.rebind(CONFIG)
      .toConstantValue({ jobs: 5 });

    const manager = container.get(TASK_MANAGER);

    expect(manager.jobs).toBe(5);
  });
});
