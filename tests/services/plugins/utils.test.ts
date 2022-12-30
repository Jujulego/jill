import { assertPlugin } from '@/src/services/plugins/utils';

// Tests
describe('assertPlugin', () => {
  it('should return given module', () => {
    const plugin = {
      builder: () => null
    };

    expect(assertPlugin(plugin, 'test')).toBeUndefined();
  });

  it('should throw if builder is missing', () => {
    expect(() => assertPlugin({}, 'test'))
      .toThrow(new Error('Plugin test is not a valid plugin. Missing builder method in default export'));
  });

  it('should throw if plugin is not an object', () => {
    expect(() => assertPlugin('test', 'test'))
      .toThrow(new Error('Plugin test is not a valid plugin. Default export is a string'));
  });

  it('should throw if plugin is undefined', () => {
    expect(() => assertPlugin(undefined, 'test'))
      .toThrow(new Error('Plugin test is not a valid plugin. Default export is null or undefined'));
  });
});
