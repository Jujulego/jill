import { Box, Static, Text, useStdout } from 'ink';
import { ReactElement } from 'react';

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
	return `${str.at(0)?.toUpperCase()}${str.substring(1)}`;
}

// Component
export const List = <K extends string>(props: ListProps<K>): ReactElement => {
	try {
		const { attrs, data, withoutHeaders = false, json = false } = props;
		const { stdout } = useStdout();

		// Render
		if (json) {
			const lines = JSON.stringify(data, null, stdout?.isTTY ? 2 : 0).split('\n');

			return (
				<Static items={lines}>
					{(line, idx) => <Text key={idx}>{line}</Text>}
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
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(e);
		throw e;
	}
};
