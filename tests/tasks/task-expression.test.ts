import { ParallelGroup, SequenceGroup } from '@jujulego/tasks';
import { vi } from 'vitest';

import { container } from '@/src/inversify.config.js';
import { type Workspace } from '@/src/project/workspace.js';
import { ScriptTask } from '@/src/tasks/script-task.js';
import { type GroupNode, TaskExpressionService, type TaskNode } from '@/src/tasks/task-expression.service.js';

import { TestBed } from '@/tools/test-bed.js';

// Setup
let service: TaskExpressionService;

let bed: TestBed;
let wks: Workspace;

beforeEach(() => {
  container.snapshot();
  service = container.get(TaskExpressionService);

  bed = new TestBed();
  wks = bed.addWorkspace('wks');
});

afterEach(() => {
  container.restore();
});

// Tests
describe('TaskExpressionService.parse', () => {
  it('should return simple task (inline syntax)', () => {
    expect(service.parse('toto:dev'))
      .toEqual({
        roots: [
          { script: 'toto:dev', args: [] },
        ]
      });
  });

  it('should return task with arguments (inline syntax)', () => {
    expect(service.parse('toto:dev -abc --arg 3'))
      .toEqual({
        roots: [
          { script: 'toto:dev', args: ['-abc', '--arg', '3'] },
        ]
      });
  });

  it('should return simple task (single cote syntax)', () => {
    expect(service.parse('\'\\\\single\\\'cote\\\\\''))
      .toEqual({
        roots: [
          { script: '\\single\'cote\\', args: [] },
        ]
      });
  });

  it('should return task with arguments (single cote syntax)', () => {
    expect(service.parse('\'single\\\'cote -abc  --arg 3\''))
      .toEqual({
        roots: [
          { script: 'single\'cote', args: ['-abc', '--arg', '3'] },
        ]
      });
  });

  it('should return simple task (double cote syntax)', () => {
    expect(service.parse('"\\\\double\\"cote\\\\"'))
      .toEqual({
        roots: [
          { script: '\\double"cote\\', args: [] },
        ]
      });
  });

  it('should return task with arguments (double cote syntax)', () => {
    expect(service.parse('"double\\"cote -abc  --arg 3"'))
      .toEqual({
        roots: [
          { script: 'double"cote', args: ['-abc', '--arg', '3'] },
        ]
      });
  });

  it('should return complex tree with 2 operators', () => {
    expect(service.parse('(toto // tata) && tutu'))
      .toEqual({
        roots: [
          {
            operator: '&&',
            tasks: [
              {
                operator: '//',
                tasks: [
                  { script: 'toto', args: [] },
                  { script: 'tata', args: [] },
                ]
              },
              { script: 'tutu', args: [] }
            ]
          }
        ]
      });
  });

  it('should return complex tree with 2 operators and arguments', () => {
    expect(service.parse('(toto --arg 1 // tata --arg 2) && tutu --arg 3'))
      .toEqual({
        roots: [
          {
            operator: '&&',
            tasks: [
              {
                operator: '//',
                tasks: [
                  { script: 'toto', args: ['--arg', '1'] },
                  { script: 'tata', args: ['--arg', '2'] },
                ]
              },
              { script: 'tutu', args: ['--arg', '3'] }
            ]
          }
        ]
      });
  });
});

describe('TaskExpressionService.buildTask', () => {
  it('should use workspace to create simple task', async () => {
    const tree: TaskNode = { script: 'test', args: [] };
    const task = new ScriptTask(wks, 'test', []);

    vi.spyOn(wks, 'run').mockResolvedValue(task);

    await expect(service.buildTask(tree, wks)).resolves.toBe(task);

    expect(wks.run).toHaveBeenCalledWith('test', [], undefined);
  });

  it('should use workspace to create task with args', async () => {
    const tree: TaskNode = { script: 'test', args: ['-abc', '--arg', '3'] };
    const task = new ScriptTask(wks, 'test', ['-abc', '--arg', '3']);

    vi.spyOn(wks, 'run').mockResolvedValue(task);

    await expect(service.buildTask(tree, wks)).resolves.toBe(task);

    expect(wks.run).toHaveBeenCalledWith('test', ['-abc', '--arg', '3'], undefined);
  });

  it('should create a parallel group', async () => {
    const tree: GroupNode = {
      operator: '//',
      tasks: [
        { script: 'test1', args: [] },
        { script: 'test2', args: [] },
      ]
    };
    vi.spyOn(wks, 'run')
      .mockImplementation(async (script) => new ScriptTask(wks, script, []));

    const group = await service.buildTask(tree, wks) as ParallelGroup;

    expect(group).toBeInstanceOf(ParallelGroup);
    expect(group.tasks).toEqual([
      expect.objectContaining({ workspace: wks, script: 'test1' }),
      expect.objectContaining({ workspace: wks, script: 'test2' }),
    ]);

    expect(wks.run).toHaveBeenCalledWith('test1', [], undefined);
    expect(wks.run).toHaveBeenCalledWith('test2', [], undefined);
  });

  it('should create a sequence group', async () => {
    const tree: GroupNode = {
      operator: '&&',
      tasks: [
        { script: 'test1', args: [] },
        { script: 'test2', args: [] },
      ]
    };
    vi.spyOn(wks, 'run')
      .mockImplementation(async (script) => new ScriptTask(wks, script, []));

    const group = await service.buildTask(tree, wks) as SequenceGroup;

    expect(group).toBeInstanceOf(SequenceGroup);
    expect(group.tasks).toEqual([
      expect.objectContaining({ workspace: wks, script: 'test1' }),
      expect.objectContaining({ workspace: wks, script: 'test2' }),
    ]);

    expect(wks.run).toHaveBeenCalledWith('test1', [], undefined);
    expect(wks.run).toHaveBeenCalledWith('test2', [], undefined);
  });
});
