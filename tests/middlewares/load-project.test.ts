import path from 'node:path';
import yargs from 'yargs';

import { applyMiddlewares } from '@/src/modules/middleware';
import { SpinnerService } from '@/src/commons/spinner.service';
import { container } from '@/src/inversify.config';
import { LoadProject } from '@/src/middlewares/load-project';
import { CURRENT } from '@/src/project/constants';
import { Project } from '@/src/project/project';

// Setup
let parser: yargs.Argv;
let spinner: SpinnerService;

beforeEach(() => {
  container.snapshot();

  spinner = container.get(SpinnerService);
  jest.spyOn(spinner, 'spin');
  jest.spyOn(spinner, 'stop');

  jest.spyOn(Project, 'searchProjectRoot')
    .mockResolvedValue('/test');

  parser = applyMiddlewares(yargs(), [LoadProject]);
});

afterEach(() => {
  container.restore();
});

// Tests
describe('LoadProject', () => {
  it('should search project root using cwd', async () => {
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
