import { useStdout } from 'ink';
import { useEffect, useEffectEvent, useState } from 'react';

export function useStdoutDimensions() {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState({
    columns: stdout.columns ?? Infinity,
    rows: stdout.rows ?? Infinity,
  });

  const updateDimensions = useEffectEvent(() => setDimensions({
    columns: stdout.columns ?? Infinity,
    rows: stdout.rows ?? Infinity,
  }));

  useEffect(() => {
    stdout.on('resize', updateDimensions);

    return () => {
      stdout.off('resize', updateDimensions);
    };
  }, [stdout]);

  return dimensions;
}
