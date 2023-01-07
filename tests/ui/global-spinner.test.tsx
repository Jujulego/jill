import { render } from 'ink-testing-library';

import { container } from '@/src/inversify.config';
import { SpinnerService } from '@/src/commons/spinner.service';
import GlobalSpinner from '@/src/ui/global-spinner';

// Setup
let spinner: SpinnerService;

beforeEach(() => {
  spinner = container.get(SpinnerService);
});

// Tests
describe('<GlobalSpinner>', () => {
  it('should subscribe to SpinnerService', function () {
    const { lastFrame } = render(<GlobalSpinner />);

    expect(lastFrame()).toBe('');

    // Call spin on service should print spinner
    spinner.spin('Testing ...');
    expect(lastFrame()).toMatch(/^. Testing \.\.\.$/);

    // Call stop should clean screen
    spinner.stop();
    expect(lastFrame()).toBe('');
  });
});
