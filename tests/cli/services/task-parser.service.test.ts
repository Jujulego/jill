import { type ScriptWorkflow$ } from '@/src/cli/jobs/run-script$.js';
import { type GroupNode, type TaskNode, TaskParserService } from '@/src/cli/services/task-parser.service.js';
import type { Workspace } from '@/src/projects/workspace.js';
import { TestBed } from '@/tools/test-bed.js';
import { type Workflow$, workflow$ } from '@jujulego/tasks';
import { globalScope$, inject$ } from '@kyrielle/injector';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Setup
let service: TaskParserService;

let bed: TestBed;
let wks: Workspace;

beforeEach(() => {
  service = inject$(TaskParserService);

  bed = new TestBed();
  wks = bed.addWorkspace('wks');
});

afterEach(() => {
  globalScope$().clear();
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

describe('TaskExpressionService.extractScripts', () => {
  it('should yield all scripts involved in task tree', async () => {
    const tree = {
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
    };

    await expect(service.extractScripts(tree)).toYield(['toto', 'tata', 'tutu']);
  });
});

describe('TaskExpressionService.buildJob', () => {
  it('should use workspace to create simple task', async () => {
    const tree = { script: 'test', args: [] } satisfies TaskNode;
    const job = workflow$({ label: 'test', onOrchestrate: vi.fn() });

    vi.spyOn(wks, 'run$').mockResolvedValue(job as ScriptWorkflow$);

    await expect(service.buildJob(tree, wks)).resolves.toBe(job);

    expect(wks.run$).toHaveBeenCalledWith('test', [], undefined);
  });

  it('should use workspace to create task with args', async () => {
    const tree: TaskNode = { script: 'test', args: ['-abc', '--arg', '3'] };
    const job = workflow$({ label: 'test', onOrchestrate: vi.fn() });

    vi.spyOn(wks, 'run$').mockResolvedValue(job as ScriptWorkflow$);

    await expect(service.buildJob(tree, wks)).resolves.toBe(job);

    expect(wks.run$).toHaveBeenCalledWith('test', ['-abc', '--arg', '3'], undefined);
  });

  it('should create a parallel group', async () => {
    const tree: GroupNode = {
      operator: '//',
      tasks: [
        { script: 'test1', args: [] },
        { script: 'test2', args: [] },
      ]
    };

    vi.spyOn(wks, 'run$')
      .mockImplementation(async (script) => workflow$({ label: script, onOrchestrate: vi.fn() }) as ScriptWorkflow$);

    const job = await service.buildJob(tree, wks);

    expect(job.type).toBe('workflow.parallel');

    const workloads = (job as Workflow$).workloads();
    expect(workloads).toHaveLength(2);

    expect(workloads[0].label).toBe('test1');
    expect(workloads[1].label).toBe('test2');

    expect(wks.run$).toHaveBeenCalledWith('test1', [], undefined);
    expect(wks.run$).toHaveBeenCalledWith('test2', [], undefined);
  });

  it('should create a sequence group', async () => {
    const tree: GroupNode = {
      operator: '&&',
      tasks: [
        { script: 'test1', args: [] },
        { script: 'test2', args: [] },
      ]
    };

    vi.spyOn(wks, 'run$')
      .mockImplementation(async (script) => workflow$({ label: script, onOrchestrate: vi.fn() }) as ScriptWorkflow$);

    const job = await service.buildJob(tree, wks);

    expect(job.type).toBe('workflow.sequence');

    const workloads = (job as Workflow$).workloads();
    expect(workloads).toHaveLength(2);

    expect(workloads[0].label).toBe('test1');
    expect(workloads[1].label).toBe('test2');

    expect(wks.run$).toHaveBeenCalledWith('test1', [], undefined);
    expect(wks.run$).toHaveBeenCalledWith('test2', [], undefined);
  });

  it('should create a fallback group', async () => {
    const tree: GroupNode = {
      operator: '||',
      tasks: [
        { script: 'test1', args: [] },
        { script: 'test2', args: [] },
      ]
    };

    vi.spyOn(wks, 'run$')
      .mockImplementation(async (script) => workflow$({ label: script, onOrchestrate: vi.fn() }) as ScriptWorkflow$);

    const job = await service.buildJob(tree, wks);

    expect(job.type).toBe('workflow.fallback');

    const workloads = (job as Workflow$).workloads();
    expect(workloads).toHaveLength(2);

    expect(workloads[0].label).toBe('test1');
    expect(workloads[1].label).toBe('test2');

    expect(wks.run$).toHaveBeenCalledWith('test1', [], undefined);
    expect(wks.run$).toHaveBeenCalledWith('test2', [], undefined);
  });
});
