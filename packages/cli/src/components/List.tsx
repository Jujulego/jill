import { Box, Text, useStdout } from 'ink';
import { ReactElement, useEffect } from 'react';

// Types
export type ListItem<K extends string> = Partial<Record<K, string | number>> & Record<string, unknown>;

export interface ListProps<K extends string> {
	attrs: K[];
	data: ListItem<K>[];
	withoutHeaders?: boolean;
	json?: boolean;
}

// Utils
function capitalize(str: string): string {
	return `${str.substring(0, 1).toUpperCase()}${str.substring(1)}`;
}

// Component
export const List = <K extends string>(props: ListProps<K>): ReactElement | null => {
	const { attrs, data, withoutHeaders = false, json = false } = props;
	const { stdout } = useStdout();

	// Effects
	useEffect(() => {
		if (!json) return;
		if (!stdout) return;

		stdout.write(JSON.stringify(data, null, stdout.isTTY ? 2 : 0));
	}, [stdout, data, json]);

	// Render
	if (json) return null;

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
