import { Logger } from '@jujulego/logger';
import { cleanup, render } from 'ink-testing-library';
import symbols from 'log-symbols';
import yargs, { type CommandModule } from 'yargs';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import '@/src/commons/logger.service.js';
import { GroupCommand } from '@/src/commands/group.js';
import { ContextService } from '@/src/commons/context.service.js';
import { CONFIG } from '@/src/config/config-loader.js';
import { INK_APP } from '@/src/ink.config.js';
import { container } from '@/src/inversify.config.js';
import { type Workspace } from '@/src/project/workspace.js';
import { TaskExpressionService } from '@/src/tasks/task-expression.service.js';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config.js';
import Layout from '@/src/ui/layout.js';

import { TestBed } from '@/tools/test-bed.js';
import { TestParallelGroup, TestScriptTask, TestTaskManager } from '@/tools/test-tasks.js';
import { flushPromises, spyLogger, wrapInkTestApp } from '@/tools/utils.js';

// Setup global config
container.rebind(CONFIG).toConstantValue({ jobs: 1 });

// Setup
let app: ReturnType<typeof render>;
let command: CommandModule;
let context: ContextService;
let manager: TestTaskManager;
let taskExpr: TaskExpressionService;

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
  task.add(new TestScriptTask(wks, 'test1', [], { logger: spyLogger, weight: 1 }));
  task.add(new TestScriptTask(wks, 'test2', [], { logger: spyLogger, weight: 1 }));

  const logger = container.get(Logger);
  context = container.get(ContextService);
  taskExpr = container.get(TaskExpressionService);

  manager = new TestTaskManager({ logger });
  container.rebind(TASK_MANAGER).toConstantValue(manager);

  app = render(<Layout />);
  Object.assign(app.stdin, { ref: () => this, unref: () => this });
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = await bed.prepareCommand(GroupCommand, wks);

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
          { script: 'test1', args: [] },
          { script: 'test2', args: [] }
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
      vi.spyOn(child, 'duration', 'get').mockReturnValue(100);

      child.emit('status.done', { status: 'done', previous: 'running' });
      child.emit('completed', { status: 'done', duration: 100 });
    }

    vi.spyOn(task, 'status', 'get').mockReturnValue('done');
    vi.spyOn(task, 'duration', 'get').mockReturnValue(100);

    task.emit('status.done', { status: 'done', previous: 'running' });
    task.emit('completed', { status: 'done', duration: 100 });

    vi.spyOn(manager, 'tasks', 'get').mockReturnValue([task, ...task.tasks]);

    await prom;

    // Should print all tasks
    expect(app.lastFrame()).toEqualLines([
      expect.ignoreColor(`${symbols.success} Test group (took 100ms)`),
      expect.ignoreColor(`  ${symbols.success} Run test1 in wks (took 100ms)`),
      expect.ignoreColor(`  ${symbols.success} Run test2 in wks (took 100ms)`),
      expect.ignoreColor(`${symbols.success} 2 done`),
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
          { script: 'test1', args: [] },
          { script: 'test2', args: [] }
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
