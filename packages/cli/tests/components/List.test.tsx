import chalk from 'chalk';
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

  it('should render as json', async () => {
    jest.spyOn(process.stdout, 'write');

    // Render
    const { lastFrame } = render(
      <List
        attrs={['id', 'result']}
        data={TEST_DATA}
        json
      />
    );
    await new Promise(res => setTimeout(res, 0));

    // Checks
    expect(lastFrame()).toMatchSnapshot();
  });
});
