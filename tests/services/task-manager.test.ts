import { container, SERVICES_CONFIG } from '@/src/services/inversify.config';
import { TASK_MANAGER } from '@/src/services/task-manager.config';

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
    container.rebind(SERVICES_CONFIG)
      .toConstantValue({ jobs: 5 });

    const manager = container.get(TASK_MANAGER);

    expect(manager.jobs).toBe(5);
  });
});
