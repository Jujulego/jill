import { useStdout } from 'ink';
import { useEffect, useState } from 'react';

export function useStdoutDimensions() {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState({ columns: stdout.columns, rows: stdout.rows });

  useEffect(() => {
    const handler = () => setDimensions({ columns: stdout.columns, rows: stdout.rows });
    stdout.on('resize', handler);

    return () => {
      stdout.off('resize', handler);
    };
  }, [stdout]);

  return dimensions;
}
