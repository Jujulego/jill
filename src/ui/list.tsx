import { Box, Text } from 'ink';
import { ReactElement } from 'react';

import { capitalize } from '../utils';

// Types
export interface ListProps<T extends Record<string, unknown>> {
  items: T[];
  headers?: boolean;
}

// Component
export function List<T extends Record<string, unknown>>({ items, headers }: ListProps<T>): ReactElement {
  return (
    <Box>
      { Object.keys(items[0]).map((key) => (
        <Box key={key} flexDirection="column" marginRight={2}>
          { headers && (
            <Text bold>{ capitalize(key) }</Text>
          ) }
          { items.map((item, idx) => (
            <Text key={idx}>{ item[key] }</Text>
          )) }
        </Box>
      )) }
    </Box>
  );
}
