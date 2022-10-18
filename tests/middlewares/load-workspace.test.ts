import yargs from 'yargs';

import { applyMiddlewares, container, CURRENT, loadWorkspace, Project, SpinnerService, Workspace } from '../../src';
import { TestBed } from '../test-bed';

// Setup
let bed: TestBed;
let parser: yargs.Argv;
let spinner: SpinnerService;

beforeEach(() => {
  container.snapshot();

  spinner = container.get(SpinnerService);
  jest.spyOn(spinner, 'spin');
  jest.spyOn(spinner, 'stop');
  jest.spyOn(spinner, 'failed');

  bed = new TestBed();
  container.bind(Project)
    .toConstantValue(bed.project)
    .whenTargetNamed(CURRENT);

  parser = applyMiddlewares(yargs(), [loadWorkspace]);
});

afterEach(() => {
  container.restore();
});

// Tests
describe('loadWorkspace', () => {
  it('should search for current workspace', async () => {
    const wks = bed.workspace('root');

    jest.spyOn(bed.project, 'workspace')
      .mockResolvedValue(wks);

    await parser.parse(''); // <= no args

    expect(spinner.spin).toHaveBeenCalledWith('Loading "." workspace ...');
    expect(bed.project.workspace).toHaveBeenCalled();

    expect(container.isBoundNamed(Workspace, CURRENT)).toBe(true);
    expect(container.getNamed(Workspace, CURRENT)).toBe(wks);

    expect(spinner.stop).toHaveBeenCalled();
  });

  it('should search for named workspace', async () => {
    jest.spyOn(bed.project, 'workspace')
      .mockResolvedValue(bed.workspace('test'));

    await parser.parse('-w test');

    expect(spinner.spin).toHaveBeenCalledWith('Loading "test" workspace ...');
    expect(bed.project.workspace).toHaveBeenCalledWith('test');
  });

  it('should print failed spinner if workspace is not found', async () => {
    jest.spyOn(yargs, 'exit').mockImplementation();
    jest.spyOn(bed.project, 'workspace')
      .mockResolvedValue(null);

    await parser.parse('-w test');

    expect(spinner.spin).toHaveBeenCalledWith('Loading "test" workspace ...');
    expect(spinner.failed).toHaveBeenCalledWith('Workspace "test" not found');

    expect(yargs.exit).toHaveBeenCalledWith(1, new Error('Workspace not found'));
  });
});