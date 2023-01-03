import { render } from 'ink-testing-library';

import List from '@/src/ui/list';

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

  it('should render empty values', () => {
    const empty = [
      { test: 'first', result: 'success' },
      { test: 'empty', result: '' },
      { test: 'second', result: 'failed' },
    ];

    const { lastFrame } = render(<List items={empty} />);

    expect(lastFrame()).toEqualLines([
      'first   success',
      'empty',
      'second  failed'
    ]);
  });

  it('should render nothing for empty list', () => {
    const { lastFrame } = render(<List items={[]} />);

    expect(lastFrame()).toEqualLines([
      ''
    ]);
  });
});
