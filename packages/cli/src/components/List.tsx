import { Box, Static, Text, useStdout } from 'ink';
import { FC } from 'react';

// Types
export interface ListProps {
	attrs: string[];
	data: Partial<Record<string, string>>[];
	withoutHeaders?: boolean;
	json?: boolean;
}

// Utils
function capitalize(str: string): string {
	return `${str.at(0)?.toUpperCase()}${str.substring(1)}`;
}

// Component
export const List: FC<ListProps> = (props) => {
	const { attrs, data, withoutHeaders, json } = props;
	const { stdout } = useStdout();

	// Render
	if (json) {
		const lines = JSON.stringify(data, null, stdout?.isTTY ? 2 : 0).split('\n');

		return (
			<Static items={lines}>
				{ (line, idx) => <Text key={idx}>{ line }</Text> }
			</Static>
		);
	}

	return (
		<Box>
			{attrs.map((attr) => (
				<Box key={attr} flexDirection="column" marginRight={2}>
					{!withoutHeaders && <Text bold>{capitalize(attr)}</Text>}
					{data.map((d, idx) => (
						<Text key={idx} color={d[attr] ? '' : 'grey'}>{d[attr] || 'unset'}</Text>
					))}
				</Box>
			))}
		</Box>
	);
};
