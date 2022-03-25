import chalk from 'chalk';
import path from 'path';

import { jill, MOCK } from '../utils';

// Tests suites
describe('jill list', () => {
  it('should print list of all projects', async () => {
    const res = await jill(['list'], { cwd: MOCK });

    expect(res.code).toBe(0);
    expect(res.frames).toEqual([
      ['⠋ Loading project ...'],
      ['⠋ Load workspaces'],
      [
        'mock-root',
        'mock-test-a',
        'mock-test-b',
        'mock-test-c',
        'mock-test-d'
      ]
    ]);
  });

  it('should print list of all private projects (--private)', async () => {
    const res = await jill(['list', '--private'], { cwd: MOCK });

    expect(res.code).toBe(0);
    expect(res.frames).toEqual([
      ['⠋ Loading project ...'],
      ['⠋ Load workspaces'],
      ['mock-root']
    ]);
  });

  it('should print list of all public projects (--no-private)', async () => {
    const res = await jill(['list', '--no-private'], { cwd: MOCK });

    expect(res.code).toBe(0);
    expect(res.frames).toEqual([
      ['⠋ Loading project ...'],
      ['⠋ Load workspaces'],
      [
        'mock-test-a',
        'mock-test-b',
        'mock-test-c',
        'mock-test-d'
      ]
    ]);
  });

  it('should print list of all public projects (--with-script start)', async () => {
    const res = await jill(['list', '--with-script', 'start'], { cwd: MOCK });

    expect(res.code).toBe(0);
    expect(res.frames).toEqual([
      ['⠋ Loading project ...'],
      ['⠋ Load workspaces'],
      ['mock-test-a']
    ]);
  });

  it('should print name and version of all projects (--attrs name version)', async () => {
    const res = await jill(['list', '--attrs', 'name', 'version'], { cwd: MOCK });

    expect(res.code).toBe(0);
    expect(res.frames).toEqual([
      ['⠋ Loading project ...'],
      ['⠋ Load workspaces'],
      [
        chalk`{bold Name}         {bold Version}`,
        chalk`mock-root    {grey unset}`,
        chalk`mock-test-a  {grey unset}`,
        chalk`mock-test-b  {grey unset}`,
        chalk`mock-test-c  {grey unset}`,
        chalk`mock-test-d  {grey unset}`,
      ]
    ]);
  });

  it('should print list of all projects with headers (--headers)', async () => {
    const res = await jill(['list', '--headers'], { cwd: MOCK });

    expect(res.code).toBe(0);
    expect(res.frames).toEqual([
      ['⠋ Loading project ...'],
      ['⠋ Load workspaces'],
      [
        chalk`{bold Name}`,
        chalk`mock-root`,
        chalk`mock-test-a`,
        chalk`mock-test-b`,
        chalk`mock-test-c`,
        chalk`mock-test-d`,
      ]
    ]);
  });

  it('should print list of all projects in long format (-l)', async () => {
    const res = await jill(['list', '-l'], { cwd: MOCK });

    expect(res.code).toBe(0);
    expect(res.frames).toEqual([
      ['⠋ Loading project ...'],
      ['⠋ Load workspaces'],
      [
        chalk`{bold Name}         {bold Version}  {bold Root}`,
        chalk`mock-root    {grey unset}    .`,
        chalk`mock-test-a  {grey unset}    workspaces${path.sep}test-a`,
        chalk`mock-test-b  {grey unset}    workspaces${path.sep}test-b`,
        chalk`mock-test-c  {grey unset}    workspaces${path.sep}test-c`,
        chalk`mock-test-d  {grey unset}    workspaces${path.sep}test-d`,
      ]
    ]);
  });

  it('should print list of all projects in json format (--json)', async () => {
    const res = await jill(['list', '--json'], { cwd: MOCK });

    expect(res.code).toBe(0);
    expect(JSON.parse(res.lastFrame.join('\n'))).toEqual([
      {
        name: 'mock-root',
        version: undefined,
        slug: 'mock-root',
        root: MOCK,
      },
      {
        name: 'mock-test-a',
        version: undefined,
        slug: 'mock-test-a',
        root: path.join(MOCK, 'workspaces', 'test-a'),
      },
      {
        name: 'mock-test-b',
        version: undefined,
        slug: 'mock-test-b',
        root: path.join(MOCK, 'workspaces', 'test-b'),
      },
      {
        name: 'mock-test-c',
        version: undefined,
        slug: 'mock-test-c',
        root: path.join(MOCK, 'workspaces', 'test-c'),
      },
      {
        name: 'mock-test-d',
        version: undefined,
        slug: 'mock-test-d',
        root: path.join(MOCK, 'workspaces', 'test-d'),
      },
    ]);
  });
});
