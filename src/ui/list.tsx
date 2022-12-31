import { Box, Text } from 'ink';

import { capitalize } from '@/src/utils/string';

// Types
export interface ListProps<T extends Record<string, unknown>> {
  items: T[];
  headers?: boolean;
}

// Component
export default function List<T extends Record<string, unknown>>({ items, headers }: ListProps<T>) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Box>
      { Object.keys(items[0]).map((key) => (
        <Box key={key} flexDirection="column" marginRight={2}>
          { headers && (
            <Text bold>{ capitalize(key) }</Text>
          ) }
          { items.map((item, idx) => (
            <Text key={idx}>{ item[key] || ' ' }</Text>
          )) }
        </Box>
      )) }
    </Box>
  );
}
