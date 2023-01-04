import { ParallelGroup, SpawnTask } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import yargs from 'yargs';

import groupCommand from '@/src/commands/group';
import { loadProject } from '@/src/middlewares/load-project';
import { loadWorkspace } from '@/src/middlewares/load-workspace';
import { setupInk } from '@/src/middlewares/setup-ink';
import { Project } from '@/src/project/project';
import { Workspace } from '@/src/project/workspace';
import { container, CURRENT, INK_APP } from '@/src/inversify.config';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { flushPromises, spyLogger } from '@/tools/utils';
import { TaskExprService } from '@/src/tasks/task-expr.service';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';

// Setup
let app: ReturnType<typeof render>;
let taskExpr: TaskExprService;

let bed: TestBed;
let wks: Workspace;
let task: ParallelGroup;

beforeEach(() => {
  container.snapshot();

  bed = new TestBed();
  wks = bed.addWorkspace('wks');

  task = new ParallelGroup('Test group', {}, { logger: spyLogger });
  task.add(new SpawnTask('test1', [], { workspace: wks, script: 'test1' }, { logger: spyLogger }));
  task.add(new SpawnTask('test2', [], { workspace: wks, script: 'test2' }, { logger: spyLogger }));

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(setupInk, 'handler').mockImplementation(() => {
    app = render(<Layout />);
    container.bind(INK_APP).toConstantValue(app as any);
  });
  jest.spyOn(loadProject, 'handler').mockImplementation(() => {
    container.bind(Project)
      .toConstantValue(bed.project)
      .whenTargetNamed(CURRENT);
  });
  jest.spyOn(loadWorkspace, 'handler').mockImplementation(() => {
    container.bind(Workspace)
      .toConstantValue(wks)
      .whenTargetNamed(CURRENT);
  });

  taskExpr = container.get(TaskExprService);
  jest.spyOn(taskExpr, 'buildTask').mockResolvedValue(task);
});

afterEach(() => {
  container.restore();
  cleanup();
});

// Tests
describe('jill group', () => {
  it('should run all tasks in current workspace', async () => {
    const manager = container.get(TASK_MANAGER);

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);

    // Run command
    const prom = yargs.command(groupCommand)
      .parse('group -w wks test1 // test2');

    await flushPromises();

    expect(taskExpr.buildTask).toHaveBeenCalledWith(
      {
        operator: '//',
        tasks: [
          { script: 'test1' },
          { script: 'test2' }
        ]
      },
      wks,
      { buildDeps: 'all' }
    );
    expect(manager.add).toHaveBeenCalledWith(task);

    // Complete tasks
    jest.spyOn(task, 'status', 'get').mockReturnValue('done');

    for (const child of task.tasks) {
      jest.spyOn(child, 'status', 'get').mockReturnValue('done');

      child.emit('status.done', { status: 'done', previous: 'running' });
      child.emit('completed', { status: 'done', duration: 100 });
    }

    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;

    // Should print all tasks
    expect(app.lastFrame()).toEqualLines([
      `${symbols.success} Test group (took 100ms)`,
      `  ${symbols.success} Running test1 in wks (took 100ms)`,
      `  ${symbols.success} Running test2 in wks (took 100ms)`,
    ]);
  });

  it('should use given dependency mode', async () => {
    const manager = container.get(TASK_MANAGER);

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);

    // Run command
    const prom = yargs.command(groupCommand)
      .parse('group -w wks --deps-mode prod test1 // test2');

    await flushPromises();

    expect(taskExpr.buildTask).toHaveBeenCalledWith(
      {
        operator: '//',
        tasks: [
          { script: 'test1' },
          { script: 'test2' }
        ]
      },
      wks,
      { buildDeps: 'prod' }
    );

    // Complete tasks
    jest.spyOn(task, 'status', 'get').mockReturnValue('done');

    for (const child of task.tasks) {
      jest.spyOn(child, 'status', 'get').mockReturnValue('done');

      child.emit('status.done', { status: 'done', previous: 'running' });
      child.emit('completed', { status: 'done', duration: 100 });
    }

    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;
  });

  it('should exit 1 if group task fails', async () => {
    const manager = container.get(TASK_MANAGER);

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);

    jest.spyOn(process, 'exit').mockImplementation();

    // Run command
    const prom = yargs.command(groupCommand)
      .parse('group -w wks --deps-mode prod test1 // test2');

    await flushPromises();

    expect(taskExpr.buildTask).toHaveBeenCalledWith(
      {
        operator: '//',
        tasks: [
          { script: 'test1' },
          { script: 'test2' }
        ]
      },
      wks,
      { buildDeps: 'prod' }
    );

    // Complete tasks
    jest.spyOn(task, 'status', 'get').mockReturnValue('failed');

    for (const child of task.tasks) {
      jest.spyOn(child, 'status', 'get').mockReturnValue('done');

      child.emit('status.done', { status: 'done', previous: 'running' });
      child.emit('completed', { status: 'done', duration: 100 });
    }

    task.emit('status.failed', { status: 'failed', previous: 'running' });
    task.emit('completed', { status: 'failed', duration: 100 });

    await prom;

    // Should print all tasks
    expect(app.lastFrame()).toEqualLines([
      `${symbols.error} Test group (took 100ms)`,
      `  ${symbols.success} Running test1 in wks (took 100ms)`,
      `  ${symbols.success} Running test2 in wks (took 100ms)`,
    ]);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
