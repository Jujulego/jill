import { commandName } from '@/src/utils/yargs.js';
import { describe, expect, it } from 'vitest';

describe('commandName', () => {
  it('should return [unknown]', () => {
    expect(commandName({})).toBe('[unknown]');
  });

  it('should return the command attribute', () => {
    expect(commandName({ command: 'test' })).toBe('test');
  });

  it('should return the first item of command attribute', () => {
    expect(commandName({ command: ['test'] })).toBe('test');
  });
});
