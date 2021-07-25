import chalk from 'chalk';

import { CliList } from '../../src/utils/cli-list';

// Setup
chalk.level = 1;

let list: CliList;

beforeEach(() => {
  list = new CliList();
});

// Test suites
describe('CliList.headers', () => {
  it('should set headers and update columns', () => {
    list.setHeaders('head1', 'head2', 'head3');

    // Checks
    expect(list.columns).toEqual([5, 5, 5]);
    expect(list.headers).toEqual(['head1', 'head2', 'head3']);
  });

  it('should be empty by default', () => {
    expect(list.headers).toEqual([]);
  });
});

describe('CliList.data', () => {
  it('should add data and update columns', () => {
    list.add(['arg1', 'arg2', 'arg3']);

    // Checks
    expect(list.columns).toEqual([4, 4, 4]);
    expect(list.data).toEqual([
      ['arg1', 'arg2', 'arg3']
    ]);

    list.add(['super-test', 'arg2', 'arg3']);

    // Checks
    expect(list.columns).toEqual([10, 4, 4]);
    expect(list.data).toEqual([
      ['arg1', 'arg2', 'arg3'],
      ['super-test', 'arg2', 'arg3']
    ]);
  });
});

describe('CliList.lines', () => {
  it('should print aligned data', () => {
    list.add(['arg1', 'arg2', 'arg3']);
    list.add(['super-test', 'arg2', 'arg3']);

    // Checks
    const gen = list.lines();

    expect(gen.next()).toEqual({ done: false, value: 'arg1        arg2  arg3' });
    expect(gen.next()).toEqual({ done: false, value: 'super-test  arg2  arg3' });
    expect(gen.next()).toEqual({ done: true });
  });

  it('should print headers first', () => {
    list.add(['arg1', 'arg2', 'arg3']);
    list.setHeaders('head1', 'head2', 'head3');

    // Checks
    const gen = list.lines();

    expect(gen.next()).toEqual({ done: false, value: chalk`{bold head1}  {bold head2}  {bold head3}` });
    expect(gen.next()).toEqual({ done: false, value: 'arg1   arg2   arg3 ' });
    expect(gen.next()).toEqual({ done: true });
  });
});
