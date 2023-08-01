import { type TaskManager } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import yargs, { type CommandModule } from 'yargs';
import { vi } from 'vitest';

import { GroupCommand } from '@/src/commands/group.js';
import { ContextService } from '@/src/commons/context.service';
import { INK_APP } from '@/src/ink.config';
import { container } from '@/src/inversify.config';
import { type Workspace } from '@/src/project/workspace';
import { TaskExprService } from '@/src/tasks/task-expr.service';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config';
import Layout from '@/src/ui/layout';

import { TestBed } from '@/tools/test-bed';
import { TestParallelGroup, TestScriptTask } from '@/tools/test-tasks';
import { flushPromises, spyLogger, wrapInkTestApp } from '@/tools/utils';

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;
let context: ContextService;
let manager: TaskManager;
let taskExpr: TaskExprService;

let bed: TestBed;
let wks: Workspace;
let task: TestParallelGroup;

beforeAll(() => {
  container.snapshot();
});

beforeEach(async () => {
  container.restore();
  container.snapshot();

  bed = new TestBed();
  wks = bed.addWorkspace('wks');

  task = new TestParallelGroup('Test group', {}, { logger: spyLogger });
  task.add(new TestScriptTask(wks, 'test1', [], { logger: spyLogger }));
  task.add(new TestScriptTask(wks, 'test2', [], { logger: spyLogger }));

  app = render(<Layout />);
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await bed.prepareCommand(GroupCommand, wks);

  context = container.get(ContextService);
  manager = container.get(TASK_MANAGER);
  taskExpr = container.get(TaskExprService);

  // Mocks
  vi.restoreAllMocks();

  vi.spyOn(taskExpr, 'buildTask').mockResolvedValue(task);

  vi.spyOn(manager, 'add').mockReturnValue(undefined);
  vi.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);
});

afterEach(() => {
  cleanup();
});

// Tests
describe('jill group', () => {
  it('should run all tasks in current workspace', async () => {
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('group test1 // test2');

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
      {
        buildDeps: 'all',
        buildScript: 'build',
      }
    );
    expect(manager.add).toHaveBeenCalledWith(task);

    // Complete tasks
    vi.spyOn(task, 'status', 'get').mockReturnValue('done');

    for (const child of task.tasks as TestScriptTask[]) {
      vi.spyOn(child, 'status', 'get').mockReturnValue('done');

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
    context.reset();

    // Run command
    const prom = yargs().command(command)
      .fail(false)
      .parse('group -d prod test1 // test2');

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
      {
        buildDeps: 'prod',
        buildScript: 'build'
      }
    );

    // Complete tasks
    vi.spyOn(task, 'status', 'get').mockReturnValue('done');

    for (const child of task.tasks as TestScriptTask[]) {
      vi.spyOn(child, 'status', 'get').mockReturnValue('done');

      child.emit('status.done', { status: 'done', previous: 'running' });
      child.emit('completed', { status: 'done', duration: 100 });
    }

    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    await prom;
  });
});
