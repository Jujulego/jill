import { CliList } from '../../src/utils/cli-list';

// Setup
let list: CliList;

beforeEach(() => {
  list = new CliList();
});

// Test suites
describe('CliList.add', () => {
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
  it('should add data and update columns', () => {
    list.add(['arg1', 'arg2', 'arg3']);
    list.add(['super-test', 'arg2', 'arg3']);

    // Checks
    const gen = list.lines();

    expect(gen.next()).toEqual({ done: false, value: 'arg1        arg2  arg3' });
    expect(gen.next()).toEqual({ done: false, value: 'super-test  arg2  arg3' });
    expect(gen.next()).toEqual({ done: true });
  });
});
