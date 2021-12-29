import { Project, Workspace } from '@jujulego/jill-core';

import { Filter } from '../../src';

// Setup
const prj = new Project('test');

beforeEach(() => {
  jest.resetAllMocks();
});

// Test suites
describe('new Filter', () => {
  it('should return true', async () => {
    const filter = new Filter();

    await expect(filter.test(new Workspace('wks', { name: 'wks' } as any, prj)))
      .resolves.toBe(true);
  });

  it('should call predicate', async () => {
    const wks = new Workspace('wks', { name: 'wks' } as any, prj);
    const pred = jest.fn().mockReturnValue(true);
    const filter = new Filter(pred);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    expect(pred).toHaveBeenCalledWith(wks);
  });
});

describe('Filter.privateWorkspace', () => {
  it('should test for private workspace', async () => {
    const filter = Filter.privateWorkspace(true);

    await expect(filter.test(new Workspace('wks', { name: 'wks' } as any, prj)))
      .resolves.toBe(false);

    await expect(filter.test(new Workspace('wks', { name: 'wks', private: true } as any, prj)))
      .resolves.toBe(true);

    await expect(filter.test(new Workspace('wks', { name: 'wks', private: false } as any, prj)))
      .resolves.toBe(false);
  });

  it('should test for public workspace', async () => {
    const filter = Filter.privateWorkspace(false);

    await expect(filter.test(new Workspace('wks', { name: 'wks' } as any, prj)))
      .resolves.toBe(true);

    await expect(filter.test(new Workspace('wks', { name: 'wks', private: true } as any, prj)))
      .resolves.toBe(false);

    await expect(filter.test(new Workspace('wks', { name: 'wks', private: false } as any, prj)))
      .resolves.toBe(true);
  });
});

describe('Filter.scripts', () => {
  it('should test for workspace with start script', async () => {
    const filter = Filter.scripts(['start', 'test']);

    await expect(filter.test(new Workspace('wks', { name: 'wks' } as any, prj)))
      .resolves.toBe(false);

    await expect(filter.test(new Workspace('wks', { name: 'wks', scripts: { start: '' } } as any, prj)))
      .resolves.toBe(true);

    await expect(filter.test(new Workspace('wks', { name: 'wks', scripts: { test: '' } } as any, prj)))
      .resolves.toBe(true);
  });
});
