import { Box, Text } from 'ink';
import { capitalize } from '../utils/string.js';
import { inked } from '../wrappers/inked.jsx';
import type { ExtractedData, ListAttr } from './list.js';

const ListInk = inked(function* (props: ListInkProps) {
  const { attributes, headers, workspaces } = props;

  yield (
    <Box>
      { attributes.map((attr) => (
        <Box key={attr} flexDirection="column" marginRight={2}>
          { headers && (
            <Text bold>{ capitalize(attr) }</Text>
          ) }
          { workspaces.map((wks, idx) => (
            <Text key={idx}>{ wks[attr] || ' ' }</Text>
          ))}
        </Box>
      )) }
    </Box>
  );
});

export default ListInk;

// Types
export interface ListInkProps {
  readonly attributes: readonly ListAttr[];
  readonly headers?: boolean;
  readonly workspaces: readonly ExtractedData[];
}
