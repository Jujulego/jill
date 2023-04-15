import yargs from 'yargs';

import { ContextService } from '@/src/commons/context.service';
import { SpinnerService } from '@/src/commons/spinner.service';
import { CURRENT } from '@/src/constants';
import { container } from '@/src/inversify.config';
import { LoadWorkspace } from '@/src/middlewares/load-workspace';
import { applyMiddlewares } from '@/src/modules/middleware';
import { Workspace } from '@/src/project/workspace';
import { ExitException } from '@/src/utils/exit';

import { TestBed } from '@/tools/test-bed';

// Setup
let bed: TestBed;
let parser: yargs.Argv;
let context: ContextService;
let spinner: SpinnerService;

beforeAll(() => {
  container.snapshot();
});

beforeEach(() => {
  container.restore();
  container.snapshot();

  context = container.get(ContextService);
  spinner = container.get(SpinnerService);
  jest.spyOn(spinner, 'spin');
  jest.spyOn(spinner, 'stop');
  jest.spyOn(spinner, 'failed');

  bed = new TestBed();

  parser = applyMiddlewares(yargs(), [LoadWorkspace]);
});

// Tests
describe('LoadWorkspace', () => {
  it('should search for current workspace', async () => {
    const wks = bed.addWorkspace('root');
    context.reset({ project: bed.project });

    jest.spyOn(bed.project, 'workspace')
      .mockResolvedValue(wks);

    await parser.parse(''); // <= no args

    expect(spinner.spin).toHaveBeenCalledWith('Loading "." workspace ...');
    expect(bed.project.workspace).toHaveBeenCalled();

    expect(context.workspace).toBe(wks);

    expect(spinner.stop).toHaveBeenCalled();
  });

  it('should search for named workspace', async () => {
    context.reset({ project: bed.project });
    jest.spyOn(bed.project, 'workspace')
      .mockResolvedValue(bed.addWorkspace('test'));

    await parser.parse('-w test');

    expect(spinner.spin).toHaveBeenCalledWith('Loading "test" workspace ...');
    expect(bed.project.workspace).toHaveBeenCalledWith('test');
  });

  it('should print failed spinner if workspace is not found', async () => {
    context.reset({ project: bed.project });
    jest.spyOn(bed.project, 'workspace')
      .mockResolvedValue(null);

    await expect(parser.parse('-w test'))
      .rejects.toEqual(new ExitException(1, 'Workspace not found'));

    expect(spinner.spin).toHaveBeenCalledWith('Loading "test" workspace ...');
    expect(spinner.failed).toHaveBeenCalledWith('Workspace "test" not found');
  });

  it('should keep workspace from context if no args are provided', async () => {
    const wks = bed.addWorkspace('parent');
    context.reset({ project: bed.project, workspace: wks });

    jest.spyOn(bed.project, 'workspace')
      .mockResolvedValue(bed.addWorkspace('test'));

    await parser.parse(''); // <= no args

    expect(bed.project.workspace).not.toHaveBeenCalled();
    expect(context.workspace).toBe(wks);
  });

  it('should replace workspace in context if args are provided', async () => {
    const wks = bed.addWorkspace('test');

    context.reset({ project: bed.project, workspace: bed.addWorkspace('parent') });

    jest.spyOn(bed.project, 'workspace')
      .mockResolvedValue(wks);

    await parser.parse('-w test');

    expect(bed.project.workspace).toHaveBeenCalledWith('test');
    expect(context.workspace).toBe(wks);
  });
});

describe('Workspace CURRENT binding', () => {
  it('should return workspace from context', () => {
    // Set project in context
    const wks = bed.addWorkspace('root');
    context.reset({ workspace: wks });

    // Use binding
    expect(container.getNamed(Workspace, CURRENT)).toBe(wks);
  });

  it('should throw if project miss in context', () => {
    // Set project in context
    context.reset();

    // Use binding
    expect(() => container.getNamed(Workspace, CURRENT))
      .toThrow(new Error('Cannot inject current workspace, it not yet defined'));
  });
});
