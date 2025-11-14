import { useStdout } from 'ink';
import { useEffect, useState } from 'react';

export function useStdoutDimensions() {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState({
    columns: stdout.columns ?? Infinity,
    rows: stdout.rows ?? Infinity,
  });

  useEffect(() => {
    const updateDimensions = () => setDimensions({
      columns: stdout.columns ?? Infinity,
      rows: stdout.rows ?? Infinity,
    });

    stdout.on('resize', updateDimensions);

    return () => {
      stdout.off('resize', updateDimensions);
    };
  }, [stdout]);

  return dimensions;
}
