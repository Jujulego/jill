import { git, Project, Workspace } from '@jujulego/jill-core';

import { AffectedFilter } from '../../src/filters';

// Setup
const prj = new Project('test');
const wks = new Workspace('wks', { name: 'wks' }, prj);

beforeEach(() => {
  jest.resetAllMocks();

  jest.spyOn(git, 'listBranches');
  jest.spyOn(git, 'listTags');

  jest.spyOn(wks, 'isAffected').mockResolvedValue(true);
});

// Test suites
describe('AffectedFilter.test', () => {
  it('should test against format', async () => {
    const filter = new AffectedFilter('format', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('format');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-wks', async () => {
    const filter = new AffectedFilter('env-%name', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-wks');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-%name', async () => {
    const filter = new AffectedFilter('env-\\%name', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-%name');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against env-\\wks', async () => {
    const filter = new AffectedFilter('env-\\\\%name', 'fallback');

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('env-\\wks');
    expect(git.listBranches).not.toHaveBeenCalled();
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against branch-2', async () => {
    const filter = new AffectedFilter('branch-*', 'fallback');

    jest.spyOn(git, 'listBranches').mockResolvedValue(['branch-1', 'branch-2']);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('branch-2');
    expect(git.listBranches).toHaveBeenCalledWith(['branch-*'], expect.objectContaining({ cwd: wks.cwd, streamLogLevel: 'debug' }));
    expect(git.listTags).not.toHaveBeenCalled();
  });

  it('should test against tag-2', async () => {
    const filter = new AffectedFilter('tag-*', 'fallback');

    jest.spyOn(git, 'listBranches').mockResolvedValue([]);
    jest.spyOn(git, 'listTags').mockResolvedValue(['tag-1', 'tag-2']);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('tag-2');
    expect(git.listBranches).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd, streamLogLevel: 'debug' }));
    expect(git.listTags).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd, streamLogLevel: 'debug' }));
  });

  it('should test against fallback', async () => {
    const filter = new AffectedFilter('tag-*', 'fallback');

    jest.spyOn(git, 'listBranches').mockResolvedValue([]);
    jest.spyOn(git, 'listTags').mockResolvedValue([]);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('fallback');
    expect(git.listBranches).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd, streamLogLevel: 'debug' }));
    expect(git.listTags).toHaveBeenCalledWith(['tag-*'], expect.objectContaining({ cwd: wks.cwd, streamLogLevel: 'debug' }));
  });

  it('should use sort arguments', async () => {
    const filter = new AffectedFilter('tag-*', 'fallback', 'v:refname');

    jest.spyOn(git, 'listBranches').mockResolvedValue([]);
    jest.spyOn(git, 'listTags').mockResolvedValue(['tag-1', 'tag-2']);

    await expect(filter.test(wks))
      .resolves.toBe(true);

    // Check
    expect(wks.isAffected).toHaveBeenCalledWith('tag-2');
    expect(git.listBranches).toHaveBeenCalledWith(['--sort', 'v:refname', 'tag-*'], expect.objectContaining({ cwd: wks.cwd, streamLogLevel: 'debug' }));
    expect(git.listTags).toHaveBeenCalledWith(['--sort', 'v:refname', 'tag-*'], expect.objectContaining({ cwd: wks.cwd, streamLogLevel: 'debug' }));
  });
});
