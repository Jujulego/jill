import { ESC } from '../ink-screen';
import { ignoreColor } from './ignore-color';

// Tests
describe('expect.ignoreColor', () => {
  it('should remove all style escape codes before using equals', () => {
    const context = {
      isNot: false,
      promise: false,
      equals: jest.fn().mockReturnValue(true),
    } as unknown as jest.MatcherContext;

    expect(ignoreColor.call(context, `${ESC}[1;34mtoto${ESC}[3mtata${ESC}[0m`, 'tototata'))
      .toMatchObject({
        pass: true
      });

    expect(context.equals).toHaveBeenCalledWith('tototata', 'tototata');
  });
});
