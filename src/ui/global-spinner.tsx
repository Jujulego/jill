import { Text } from 'ink';
import Spinner from 'ink-spinner';
import { FC, useLayoutEffect, useState } from 'react';

import { container, SpinnerService, SpinnerState } from '../services';

// Components
export const GlobalSpinner: FC = () => {
  // State
  const [state, setState] = useState<SpinnerState>({ spin: false, label: '' });

  // Effect
  useLayoutEffect(() => {
    const spinner = container.get(SpinnerService);
    setState(spinner.state);

    return spinner.subscribe(setState);
  }, []);

  // Render
  if (state.spin) {
    return (
      <Text>
        <Spinner />{' ' + state.label}
      </Text>
    );
  }

  return <></>;
};
