import { ParallelGroup, SpawnTask } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import yargs, { type CommandModule } from 'yargs';

import '@/src/commands/group';
import { COMMAND } from '@/src/modules/command';
import { INK_APP } from '@/src/ink.config';
import { container } from '@/src/inversify.config';
import { LoadProject } from '@/src/middlewares/load-project';
import { LoadWorkspace } from '@/src/middlewares/load-workspace';
import { CURRENT } from '@/src/project/constants';
import { Project } from '@/src/project/project';
import { Workspace } from '@/src/project/workspace';
import { TaskExprService } from '@/src/tasks/task-expr.service';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { flushPromises, spyLogger, wrapInkTestApp } from '@/tools/utils';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;
let taskExpr: TaskExprService;

let bed: TestBed;
let wks: Workspace;
let task: ParallelGroup;

beforeEach(async () => {
  container.snapshot();

  bed = new TestBed();
  wks = bed.addWorkspace('wks');

  task = new ParallelGroup('Test group', {}, { logger: spyLogger });
  task.add(new SpawnTask('test1', [], { workspace: wks, script: 'test1' }, { logger: spyLogger }));
  task.add(new SpawnTask('test2', [], { workspace: wks, script: 'test2' }, { logger: spyLogger }));

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await container.getNamedAsync(COMMAND, 'group');

  // Mocks
  jest.resetAllMocks();
  jest.restoreAllMocks();

  jest.spyOn(LoadProject.prototype, 'handler').mockImplementation(async () => {
    container.bind(Project).toConstantValue(bed.project).whenTargetNamed(CURRENT);
  });

  jest.spyOn(LoadWorkspace.prototype, 'handler').mockImplementation(async () => {
    container.bind(Workspace).toConstantValue(wks).whenTargetNamed(CURRENT);
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
    const prom = yargs.command(command)
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
      expect.ignoreColor(`${symbols.success} Test group (took 100ms)`),
      expect.ignoreColor(`  ${symbols.success} Running test1 in wks (took 100ms)`),
      expect.ignoreColor(`  ${symbols.success} Running test2 in wks (took 100ms)`),
    ]);
  });

  it('should use given dependency mode', async () => {
    const manager = container.get(TASK_MANAGER);

    jest.spyOn(manager, 'add').mockImplementation();
    jest.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);

    // Run command
    const prom = yargs.command(command)
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
    const prom = yargs.command(command)
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
      expect.ignoreColor(`${symbols.error} Test group (took 100ms)`),
      expect.ignoreColor(`  ${symbols.success} Running test1 in wks (took 100ms)`),
      expect.ignoreColor(`  ${symbols.success} Running test2 in wks (took 100ms)`),
    ]);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
