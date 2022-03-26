import { Workspace } from '@jujulego/jill-core';
import { Text, TextProps } from 'ink';
import { FC } from 'react';

// Types
export interface WorkspaceNameProps extends TextProps {
  workspace: Workspace;
}

// Component
export const WorkspaceName: FC<WorkspaceNameProps> = ({ workspace, ...style }) => (
  <Text {...style}>
    { workspace.name }
    { workspace.version && (<Text color="grey">@{ workspace.version }</Text>) }
  </Text>
);
