import { capitalize } from '../../src/utils';

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
