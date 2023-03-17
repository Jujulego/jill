import { capitalize, splitCommandLine } from '@/src/utils/string';

// Tests
describe('capitalize', () => {
  it('should return capitalized text from lower cased text', () => {
    expect(capitalize('toto')).toBe('Toto');
  });

  it('should return capitalized text from upper cased text', () => {
    expect(capitalize('TOTO')).toBe('Toto');
  });

  it('should return capitalized text from strange cased text', () => {
    expect(capitalize('tOTo')).toBe('Toto');
  });
});

describe('splitCommandLine', () => {
  it('should split line following spaces', () => {
    expect(splitCommandLine('cmd arg1 arg2 arg3'))
      .toEqual({
        command: 'cmd',
        args: ['arg1', 'arg2', 'arg3']
      });
  });

  it('should not split between double cotes', () => {
    expect(splitCommandLine('cmd arg1 "long arg"'))
      .toEqual({
        command: 'cmd',
        args: ['arg1', '"long arg"']
      });
  });

  it('should not split between simple cotes', () => {
    expect(splitCommandLine('cmd arg1 \'long arg\''))
      .toEqual({
        command: 'cmd',
        args: ['arg1', '\'long arg\'']
      });
  });
});
