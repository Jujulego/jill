import { Project, Workspace } from '@jujulego/jill-core';
import chalk from 'chalk';
import { render } from 'ink-testing-library';

import { WorkspaceName } from '../../src';
import { pkg } from '../utils/package';

// Setup
chalk.level = 1;

// Tests
describe('WorkspaceName', () => {
  it('should render workspace name only', () => {
    const wks = new Workspace('wks', pkg({ name: 'wks', version: '' }), new Project('/'));

    // Render
    const { lastFrame } = render(
      <WorkspaceName workspace={wks} />
    );

    expect(lastFrame()).toBe('wks');
  });

  it('should render workspace name and version', () => {
    const wks = new Workspace('wks', pkg({ name: 'wks', version: '1.0.0' }), new Project('/'));

    // Render
    const { lastFrame } = render(
      <WorkspaceName workspace={wks} />
    );

    expect(lastFrame()).toBe(chalk`wks{grey @1.0.0}`);
  });
});
