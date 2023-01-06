import path from 'node:path';
import yargs from 'yargs';

import { loadProject } from '@/src/middlewares/load-project';
import { Project } from '@/src/project/project';
import { container } from '@/src/inversify.config';
import { SpinnerService } from '@/src/commons/spinner.service';
import { applyMiddlewares } from '@/src/utils/yargs';
import { CURRENT } from '@/src/project/constants';

// Setup
let parser: yargs.Argv;
let spinner: SpinnerService;

beforeEach(async () => {
  container.snapshot();

  spinner = container.get(SpinnerService);
  jest.spyOn(spinner, 'spin');
  jest.spyOn(spinner, 'stop');

  jest.spyOn(Project, 'searchProjectRoot')
    .mockResolvedValue('/test');

  parser = await applyMiddlewares(yargs(), [loadProject]);
});

afterEach(() => {
  container.restore();
});

// Tests
describe('loadProject', () => {
  it('should search project root using cwd and bind CURRENT_PROJECT', async () => {
    await parser.parse(''); // <= no args

    expect(spinner.spin).toHaveBeenCalledWith('Loading project ...');
    expect(Project.searchProjectRoot).toHaveBeenCalledWith(process.cwd());

    expect(container.isBoundNamed(Project, CURRENT)).toBe(true);
    expect(container.getNamed(Project, CURRENT).root).toBe(path.resolve('/test'));

    expect(spinner.stop).toHaveBeenCalled();
  });

  it('should search project root using arguments', async () => {
    await parser.parse('-p /toto');

    expect(Project.searchProjectRoot).toHaveBeenCalledWith('/toto');
  });

  it('should set package manager using arguments', async () => {
    await parser.parse('--package-manager npm');

    expect(container.isBoundNamed(Project, CURRENT)).toBe(true);
    await expect(container.getNamed(Project, CURRENT).packageManager())
      .resolves.toBe('npm');
  });
});
