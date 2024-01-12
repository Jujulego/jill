import { Logger } from '@jujulego/logger';
import { ParallelGroup, SpawnTask, type Task, type TaskManager } from '@jujulego/tasks';
import { cleanup, render } from 'ink-testing-library';
import { injectable } from 'inversify';
import symbols from 'log-symbols';
import { vi } from 'vitest';

import '@/src/commons/logger.service.js';
import { CONFIG } from '@/src/config/config-loader.js';
import { INK_APP } from '@/src/ink.config.js';
import { container } from '@/src/inversify.config.js';
import { TaskCommand } from '@/src/modules/task-command.js';
import { type Workspace } from '@/src/project/workspace.js';
import { TASK_MANAGER } from '@/src/tasks/task-manager.config.js';
import Layout from '@/src/ui/layout.js';
import { ExitException } from '@/src/utils/exit.js';
import { printJson } from '@/src/utils/json.js';

import { TestBed } from '@/tools/test-bed.js';
import { TestScriptTask } from '@/tools/test-tasks.js';
import { flushPromises, spyLogger, wrapInkTestApp } from '@/tools/utils.js';

// Setup global config
container.rebind(CONFIG).toConstantValue({ jobs: 1 });

// Class
@injectable()
class TestTaskCommand extends TaskCommand {
  // Methods
  // eslint-disable-next-line require-yield
  *prepare(): Generator<Task> {
    return;
  }
}

// Setup
let app: ReturnType<typeof render>;
let manager: TaskManager;
let command: TaskCommand;

let bed: TestBed;
let wks: Workspace;
let task: TestScriptTask;

vi.mock('@/src/utils/json');

beforeEach(async () => {
  container.snapshot();

  bed = new TestBed();
  wks = bed.addWorkspace('wks');
  task = new TestScriptTask(wks, 'cmd', [], { logger: spyLogger, weight: 1 });

  app = render(<Layout/>);
  Object.assign(app.stdin, { ref: () => this, unref: () => this });
  container.rebind(INK_APP).toConstantValue(wrapInkTestApp(app));

  command = container.resolve(TestTaskCommand);
  manager = container.get(TASK_MANAGER);

  // Mocks
  vi.restoreAllMocks();

  vi.spyOn(command, 'prepare').mockImplementation(function* () {
    yield task;
  });

  vi.spyOn(manager, 'add').mockReturnValue(undefined);
  vi.spyOn(manager, 'tasks', 'get').mockReturnValue([task]);
});

afterEach(() => {
  container.restore();
  cleanup();
});

// Tests
describe('TaskCommand', () => {
  describe('run mode', () => {
    it('should start yielded tasks and print their status', async () => {
      // Run command
      const prom = command.handler({ $0: 'jill', _: [] });
      await flushPromises();

      // should add task to manager
      expect(manager.add).toHaveBeenCalledWith(task);

      // should print task spinner
      expect(app.lastFrame()).toEqual(expect.ignoreColor(/^. Run cmd in wks$/));

      // complete task
      vi.spyOn(task, 'status', 'get').mockReturnValue('done');
      vi.spyOn(task, 'duration', 'get').mockReturnValue(100);

      task.emit('status.done', { status: 'done', previous: 'running' });
      task.emit('completed', { status: 'done', duration: 100 });

      await prom;

      // should print task completed
      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor(`${symbols.success} Run cmd in wks (took 100ms)`),
        expect.ignoreColor(`${symbols.success} 1 done`),
      ]);
    });

    it('should exit 1 if a task fails', async () => {
      // Run command
      const prom = command.handler({ $0: 'jill', _: [] });
      await flushPromises();

      // complete task
      vi.spyOn(task, 'status', 'get').mockReturnValue('failed');
      vi.spyOn(task, 'duration', 'get').mockReturnValue(100);

      task.emit('status.failed', { status: 'failed', previous: 'running' });
      task.emit('completed', { status: 'failed', duration: 100 });

      await expect(prom).rejects.toEqual(new ExitException(1));

      // should print task failed
      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor(`${symbols.error} Run cmd in wks (took 100ms)`),
        expect.ignoreColor(`${symbols.error} 1 failed`)
      ]);
    });

    it('should log and exit if no task were yielded', async () => {
      const logger = container.get(Logger);

      vi.spyOn(logger, 'warning').mockReturnValue(undefined);
      vi.mocked(command.prepare).mockImplementation(function* () {});

      // Run command
      await command.handler({ $0: 'jill', _: [] });

      // should have only logged
      expect(manager.add).not.toHaveBeenCalled();
      expect(logger.warning).toHaveBeenCalledWith('No task found');
    });
  });

  describe('plan mode', () => {
    it('should print plan in a list (--plan --plan-mode list)', async () => {
      // Run command
      await command.handler({ $0: 'jill', _: [], plan: true, planMode: 'list' });

      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor('Id      Name  Workspace  Group  Depends on'),
        expect.ignoreColor(`${task.id.substring(0, 6)}  ${task.name}   ${wks.name}`),
      ]);
    });

    it('should print plan with dependent tasks as list', async () => {
      // Create tasks
      const tsk1 = new SpawnTask('test1', [], { workspace: wks, script: 'test1' }, { logger: spyLogger });
      const tsk2 = new SpawnTask('test2', [], { workspace: wks, script: 'test2' }, { logger: spyLogger });

      task.dependsOn(tsk1);
      task.dependsOn(tsk2);
      tsk1.dependsOn(tsk2);

      vi.spyOn(manager, 'tasks', 'get').mockReturnValue([task, tsk1, tsk2]);
      vi.spyOn(command, 'prepare').mockImplementation(function* () {
        yield task;
        yield tsk1;
        yield tsk2;
      });

      // Run command
      await command.handler({ $0: 'jill', _: [], plan: true, planMode: 'list' });

      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor('Id      Name   Workspace  Group  Depends on'),
        expect.ignoreColor(`${tsk2.id.substring(0, 6)}  ${tsk2.name}  ${wks.name}`),
        expect.ignoreColor(`${tsk1.id.substring(0, 6)}  ${tsk1.name}  ${wks.name}               ${tsk2.id.substring(0, 6)}`),
        expect.ignoreColor(`${task.id.substring(0, 6)}  ${task.name}    ${wks.name}               ${tsk1.id.substring(0, 6)}, ${tsk2.id.substring(0, 6)}`),
      ]);
    });

    it('should print plan with group task as list', async () => {
      // Create group
      const tsk1 = new SpawnTask('test1', [], { workspace: wks, script: 'test1' }, { logger: spyLogger });
      const tsk2 = new SpawnTask('test2', [], { workspace: wks, script: 'test2' }, { logger: spyLogger });

      const group = new ParallelGroup('Test group', {}, { logger: spyLogger });
      group.add(tsk1);
      group.add(tsk2);

      vi.spyOn(manager, 'tasks', 'get').mockReturnValue([group]);
      vi.spyOn(command, 'prepare').mockImplementation(function* () {
        yield group;
      });

      // Run command
      await command.handler({ $0: 'jill', _: [], plan: true, planMode: 'list' });

      expect(app.lastFrame()).toEqualLines([
        expect.ignoreColor('Id      Name        Workspace  Group   Depends on'),
        expect.ignoreColor(`${group.id.substring(0, 6)}  ${group.name}`),
        expect.ignoreColor(`${tsk1.id.substring(0, 6)}  ${tsk1.name}       ${wks.name}        ${group.id.substring(0, 6)}`),
        expect.ignoreColor(`${tsk2.id.substring(0, 6)}  ${tsk2.name}       ${wks.name}        ${group.id.substring(0, 6)}`),
      ]);
    });

    it('should print plan in json (--plan --plan-mode json)', async () => {
      // Run command
      await command.handler({ $0: 'jill', _: [], plan: true, planMode: 'json' });

      expect(printJson).toHaveBeenCalledWith([task.summary]);
    });
  });
});
