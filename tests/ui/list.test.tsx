import { render } from 'ink-testing-library';

import { List } from '../../src';

// Constants
const data = [
  { test: 'first', result: 'success' },
  { test: 'second', result: 'failed' },
];

// Tests
describe('<List>', () => {
  it('should each item values without headers', () => {
    const { lastFrame } = render(<List items={data} />);

    expect(lastFrame()).toEqualLines([
      'first   success',
      'second  failed'
    ]);
  });

  it('should each item values with headers', () => {
    const { lastFrame } = render(<List items={data} headers />);

    expect(lastFrame()).toEqualLines([
      'Test    Result',
      'first   success',
      'second  failed'
    ]);
  });
});
