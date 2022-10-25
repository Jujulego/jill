import { Text } from 'ink';
import Spinner from 'ink-spinner';
import symbols from 'log-symbols';
import { FC, useLayoutEffect, useState } from 'react';

import { container, SpinnerService, SpinnerState } from '../services';

// Components
export const GlobalSpinner: FC = () => {
  // State
  const [state, setState] = useState<SpinnerState>({ status: 'stop', label: '' });

  // Effect
  useLayoutEffect(() => {
    const spinner = container.get(SpinnerService);
    setState(spinner.state);

    return spinner.subscribe(setState);
  }, []);

  // Render
  switch (state.status) {
    case 'spin':
      return (
        <Text>
          <Spinner />{' ' + state.label}
        </Text>
      );

    case 'success':
      return (
        <Text color="green">
          {symbols.success} {state.label}
        </Text>
      );

    case 'failed':
      return (
        <Text color="red">
          {symbols.error} {state.label}
        </Text>
      );

    case 'stop':
    default:
      return null;
  }
};
