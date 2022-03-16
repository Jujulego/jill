import chalk from 'chalk';
import ink from 'ink';
import { render } from 'ink-testing-library';

import { List } from '../../src/components/List';

// Constants
const TEST_DATA = [
  { id: 85, name: 'Test n°85', result: 'success' },
  { id: 128, name: 'Test n°128', result: 'failed' },
  { id: 223, name: 'Test n°223' },
];

// Setup
chalk.level = 1;

// Mocks
jest.mock('ink', () => {
  const original = jest.requireActual('ink');

  return {
    ...original,
    useStdout: jest.fn().mockReturnValue({ stdout: { isTTY: false }})
  };
});

// Tests
describe('List', () => {
  it('should render data in aligned column', () => {
    // Render
    const { lastFrame } = render(
      <List
        attrs={['id', 'result']}
        data={TEST_DATA}
      />
    );

    // Checks
    expect(lastFrame()).toBe(
      chalk`{bold Id}   {bold Result}\n` +
      chalk`85   success\n` +
      chalk`128  failed\n` +
      chalk`223  {grey unset}`
    );
  });

  it('should render without headers', () => {
    // Render
    const { lastFrame } = render(
      <List
        attrs={['id', 'result']}
        data={TEST_DATA}
        withoutHeaders
      />
    );

    // Checks
    expect(lastFrame()).toBe(
      chalk`85   success\n` +
      chalk`128  failed\n` +
      chalk`223  {grey unset}`
    );
  });

  it('should render as json', () => {
    // Render
    const { lastFrame } = render(
      <List
        attrs={['id', 'result']}
        data={TEST_DATA}
        json
      />
    );

    // Checks
    expect(lastFrame()).toMatchSnapshot();
  });

  it('should render as indented json', () => {
    jest.mocked(ink.useStdout).mockReturnValue({ stdout: { isTTY: true }} as any);

    // Render
    const { lastFrame } = render(
      <List
        attrs={['id', 'result']}
        data={TEST_DATA}
        json
      />
    );

    // Checks
    expect(lastFrame()).toMatchSnapshot();
  });
});
